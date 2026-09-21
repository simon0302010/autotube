import { mkdir } from "node:fs/promises";
import { ENV_PATHS } from ".";
import type { ApiSetup } from "./agent/llm";
import type { ModelList } from "./agent/models";
import { defaultProviders, type Providers } from "./agent/providers";
import { confirm, input, password, search, select } from "@inquirer/prompts";
import { TOML } from "bun";
import type { CompactionStrategy } from "./agent/compaction";

export const DEFAULT_USE_24_HOUR_TIME: boolean = true;

export interface AutotubeConfig {
  providers?: Providers; /** @defaultValue {@link ./agent/providers#defaultProviders} */
  provider?: string; /** The provider to use

  @remarks
  Required in headless environments.
  If not specified, users will be prompted to select a provider. */

  apiKey?: string; /** The API key to use

  @remarks
  Required in headless environments.
  If not specified, users will be prompted to enter an API key. */

  model?: string; /** The model to use

  @remarks
  Required in headless environments.
  If not specified, users will be prompted to select a model. */

  checkModels?: boolean; /** Whether to fetch the models list and, if specified, validate `model`

  @defaultValue true
  @remarks
  If `model` is not found in the list, an error will be thrown. */

  autoRetry?: boolean; /** Automatically retry if an API error occurs

  @defaultValue true */

  autoRetryDelayMs?: number; /** Delay between retries in milliseconds

  @defaultValue 1000
  @remarks
  Only relevant if `autoRetry` is true. When set to 0, there will be no delay between retries. */

  autoRetryDelayIncreaseFactor?: number; /** Factor by which the delay increases each retry

  @defaultValue 2
  @remarks
  Only relevant if `autoRetry` is true. If less than or equal to 1, the delay will not increase. */

  autoRetryMaxRetries?: number; /** Maximum number of retries

  @defaultValue 10
  @remarks
  Only relevant if `autoRetry` is true. Set to -1 for unlimited retries (not recommended). */

  compaction?: boolean; /** Whether to compact the history

  @defaultValue false
  */

  compactionMaxTokens?: number; /** If history tokens exceed this value, compact the history

  @defaultValue 65536
  @remarks
  Only relevant if `compaction` is true. When set to 0, the history will not be compacted.
  When set to a negative value, the history will not be compacted.
  */

  compactionStrategy?: CompactionStrategy; /** The strategy to use when compacting the history

  @defaultValue "truncate"
  @remarks
  Only relevant if `compaction` is true. 
  "truncate": Truncates the history to fit within the context window
  "summarize": Summarizes the history to fit within the context window (uses AI)
  */

  compactionTargetRatio?: number; /** The ratio of the history to keep after compaction

  @defaultValue 0.5
  @remarks
  Only relevant if `compaction` is true.
  */

  compactionMaxAttempts?: number; /** The maximum number of attempts to compact the history

  @defaultValue 8
  @remarks
  Only relevant if `compaction` is true.
  */

  use24HourTime?: boolean; /** Whether to use the 24-hour time format in the TUI

  @remarks
  If not specified, users will be prompted to choose between the 2 major time formats.
  Defaults to `DEFAULT_USE_24_HOUR_TIME` in headless mode. */
}

export const DEFAULT_CONFIG: AutotubeConfig = {
  providers: defaultProviders,
  checkModels: true,
  autoRetry: true,
  autoRetryDelayMs: 1000,
  autoRetryDelayIncreaseFactor: 2,
  autoRetryMaxRetries: 10,
  compactionMaxTokens: 65536,
  compaction: true,
  compactionStrategy: "truncate",
  compactionTargetRatio: 0.5,
  compactionMaxAttempts: 8,
  use24HourTime: true,
};

// TODO: Integrate prompts with dedicated TUI
export class ConfigManager {
  private _config: AutotubeConfig;
  private isHeadless: boolean;
  private models: ModelList | null = null;

  constructor(config?: AutotubeConfig, isHeadless?: boolean) {
    this.isHeadless = isHeadless ?? false;
    this._config = {
      ...config,
    };
  }

  get config(): AutotubeConfig {
    return new Proxy(this._config, {
      get: (target, prop: string | symbol) => {
        const value = Reflect.get(target, prop);

        if (value !== undefined) return value;
        return Reflect.get(DEFAULT_CONFIG, prop);
      },
    });
  }

  private async setupProvider(): Promise<void> {
    if (
      !this.config.providers ||
      Object.keys(this.config.providers).length === 0
    ) {
      throw new Error("No providers specified");
    }

    const provider = await select({
      message: "Select your AI provider",
      choices: Object.keys(this.config.providers),
    });

    this._config.provider = provider;
  }

  private async setupApiKey(): Promise<void> {
    let envApiKey: string | undefined;
    let apiKeyVar: string | undefined;

    if (this._config.provider) {
      const provider = this._config.providers?.[this._config.provider];
      if (provider?.apiKeyVar) {
        const envVar = process.env[provider?.apiKeyVar];
        if (envVar && envVar != "") {
          envApiKey = envVar;
          apiKeyVar = provider?.apiKeyVar;
        }
      }
    }

    const message =
      envApiKey && apiKeyVar
        ? `Input your API key, or press enter to use ${apiKeyVar}`
        : "Input your API key";

    const userInput = await password({
      message,
      toggleMask: true,
    });

    if (!userInput || userInput.trim() == "") {
      this._config.apiKey = envApiKey;
    } else {
      this._config.apiKey = userInput;
    }
  }

  private async fetchModels(): Promise<void> {
    const selectedProvider = this._config.provider;

    if (!selectedProvider) {
      throw new Error("No provider selected");
    }

    const provider = this._config.providers![selectedProvider];

    if (!provider) {
      throw new Error("Provider not found");
    }

    let response;
    try {
      response = await fetch(`${provider.baseUrl}/models`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + this._config.apiKey,
        },
        signal: AbortSignal.timeout(10000),
      });
    } catch (e) {
      if (e instanceof TypeError) {
        console.error(`Failed to get models list: ${e.message}`);
      } else if (e instanceof DOMException) {
        console.error(`Failed to get models list: ${e.message}`);
      } else {
        console.error(e);
      }
      process.exit(1);
    }

    if (response.ok) {
      this.models = (await response.json()) as ModelList;
    } else {
      throw new Error(`Failed to get models from provider: ${response.status}`);
    }
  }

  private async promptModel(): Promise<void> {
    this._config.model = await input({ message: "Input model name" });
  }

  private async setupModel(): Promise<void> {
    if (this.config.checkModels) {
      if (!this.models) {
        await this.fetchModels();
      }

      if (this.models!.data.length === 0) {
        console.warn("No models found.");
        await this.promptModel();
        return;
      }

      const selectedModel = await search({
        message: "Select an AI model",
        source: async (input) => {
          if (!input) {
            return [];
          }

          const matchingModels = this.models!.data.filter((model) => {
            return (
              model.id.toLowerCase().includes(input.toLowerCase().trim()) ||
              (model.name ?? model.id)
                .toLowerCase()
                .includes(input.toLowerCase().trim())
            );
          });

          return matchingModels.map((model) => ({
            name: model.name,
            value: model.id,
            description: model.description,
          }));
        },
      });

      this._config.model = selectedModel;
    } else {
      // Since `checkModels` is false (thus we have no list), we simply ask the user through text input
      await this.promptModel();
    }
  }

  private async setupTimeFormat(): Promise<void> {
    const use24HourTime: boolean = await select({
      message: "Select your preferred time format",
      choices: [
        { name: "12-hour format", value: false },
        { name: "24-hour format", value: true },
      ],
    });

    this._config.use24HourTime = use24HourTime;
  }

  /** Assumes `checkModels` is true */
  private async validateModel(): Promise<void> {
    if (!this.config.model) {
      throw new Error("No model specified");
    }

    const selectedModel = this.config.model;

    if (!this.models) {
      await this.fetchModels();
    }

    const model = this.models!.data.find((model) => model.id === selectedModel);

    if (!model) {
      throw new Error("Model not found");
    }
  }

  async saveConfig(path: string): Promise<void> {
    await mkdir(ENV_PATHS.config, { recursive: true });
    const config = TOML.stringify(this._config);
    if (config) Bun.write(path, config);
  }

  async askSaveConfig(path: string): Promise<void> {
    if (
      await confirm({
        message: `Do you want to save these options to ${path}?`,
      })
    )
      this.saveConfig(path);
  }

  /** Checks each config item that is unset and prompts for user input. */
  async validateHeaded(): Promise<void> {
    if (!this.config.provider) {
      await this.setupProvider();
    }
    if (!this.config.apiKey) {
      await this.setupApiKey();
    }
    if (!this.config.model) {
      await this.setupModel();
    }

    if (this.config.checkModels) {
      await this.validateModel();
    }

    if (this._config.use24HourTime === undefined) {
      await this.setupTimeFormat();
    }
  }

  async validateHeadless(): Promise<void> {
    if (!this.config.provider) {
      throw new Error("No provider specified");
    }
    if (!this.config.apiKey) {
      throw new Error("No API key specified");
    }
    if (!this.config.model) {
      throw new Error("No model specified");
    }

    if (this.config.checkModels) {
      await this.validateModel();
    }
  }

  async validate(): Promise<void> {
    if (this.isHeadless) {
      await this.validateHeadless();
    } else {
      await this.validateHeaded();
    }
  }

  // Returns ApiSetup which can be passed to any llm functions
  async getApiSetup(): Promise<ApiSetup | undefined> {
    if (!this._config.provider || !this._config.apiKey) return undefined;

    const provider = this._config.providers![this._config.provider];
    const model = this.models?.data.find((model) => {
      return model.id.trim() === this._config.model?.trim();
    });
    const baseUrl = provider?.baseUrl;
    if (!baseUrl) return undefined;

    // Gets the contextLength from the model list
    const contextLength =
      this._config.compactionMaxTokens ??
      model?.context_length ??
      this.config.compactionMaxTokens!;

    return {
      baseUrl,
      apiKey: this._config.apiKey,
      model,
      autoRetry: this._config.autoRetry
        ? {
            delayMs: this.config.autoRetryDelayMs!,
            delayIncreaseFactor: this.config.autoRetryDelayIncreaseFactor!,
            maxRetries: this.config.autoRetryMaxRetries!,
          }
        : undefined,
      compaction: this._config.autoRetry
        ? {
            maxTokens: contextLength,
            strategy: this.config.compactionStrategy!,
            targetRatio: this.config.compactionTargetRatio!,
            maxAttempts: this.config.compactionMaxAttempts!,
          }
        : undefined,
    };
  }

  // Returns the configured apiKey if `provider` matches
  async getProviderApiKey(provider: string): Promise<string | undefined> {
    if (this._config.provider == provider) {
      return this._config.apiKey;
    } else {
      return undefined;
    }
  }
}
