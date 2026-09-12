import type { ApiSetup } from "./llm";
import type { ModelList } from "./models";
import { defaultProviders, type Providers } from "./providers";
import { input, password, search, select } from "@inquirer/prompts";

export interface AutotubeConfig {
  providers?: Providers; /* @defaultValue {@link ./providers#defaultProviders} */
  provider?: string; /* The provider to use

  @remarks
  Required in headless environments.
  If not specified, users will be prompted to select a provider. */

  apiKey?: string; /* The API key to use

  @remarks
  Required in headless environments.
  If not specified, users will be prompted to enter an API key. */

  model?: string; /* The model to use

  @remarks
  Required in headless environments.
  If not specified, users will be prompted to select a model. */

  checkModels?: boolean; /* Whether to fetch the models list and, if specified, validate `model`

  @defaultValue true
  @remarks
  If `model` is not found in the list, an error will be thrown.
  */
}

export const defaultConfig: AutotubeConfig = {
  providers: defaultProviders,
  checkModels: true,
};

// TODO: Integrate prompts with dedicated TUI
export class ConfigManager {
  private _config: AutotubeConfig;
  private isHeadless: boolean;
  private models: ModelList | null = null;

  constructor(config?: AutotubeConfig, isHeadless?: boolean) {
    this.isHeadless = isHeadless ?? false;
    this._config = {
      ...defaultConfig,
      ...config,
    };
  }

  get config(): AutotubeConfig {
    return this._config;
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

    if (this._config.provider) {
      const provider = this._config.providers?.[this._config.provider];
      if (provider?.apiKeyVar) {
        const envVar = process.env[provider?.apiKeyVar];
        if (envVar && envVar != "") {
          envApiKey = envVar;
        }
      }
    }

    const message = envApiKey
      ? "Input your API key, or press enter to use the environment variable"
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

    const response = await fetch(`${provider.baseUrl}/models`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + this._config.apiKey,
      },
      signal: AbortSignal.timeout(10000),
    });

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
              model.name.toLowerCase().includes(input.toLowerCase().trim())
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

  /* Assumes `checkModels` is true */
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

  /* Checks each config item that is unset and prompts for user input. */
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

    const baseUrl = this._config.providers![this._config.provider]?.baseUrl;
    if (!baseUrl) return undefined;

    return { baseUrl, apiKey: this._config.apiKey, model: this._config.model };
  }
}
