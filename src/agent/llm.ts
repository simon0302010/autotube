import OpenAI, { APIError } from "openai";
import type {
  ResponseFunctionToolCall,
  ResponseInput,
  ResponseInputItem,
  ResponseOutputItem,
  ResponseReasoningTextDeltaEvent,
} from "openai/resources/responses/responses.mjs";
import type { ConfigManager } from "../config";
import { toolRegistry } from "./tools/toolRegistry";
import type { ReadFileImageResult } from "./tools/readFile";
import "./tools";
import { AsyncQueue } from "../utils";
import { isRetryableError } from "./retry";
import { compact, type CompactionStrategy } from "./compaction";
import type { ModelInfo } from "./models";

export interface ApiSetup {
  apiKey: string;
  baseUrl: string;
  model?: ModelInfo;
  autoRetry?: {
    delayMs: number;
    delayIncreaseFactor: number;
    maxRetries: number;
  };
  compaction?: {
    maxTokens: number;
    strategy: CompactionStrategy;
    targetRatio: number; // How much of maxTokens we should achieve to stop compacting
  };
}

export type StreamableMessage = {
  type: "message";
  stream: AsyncIterable<string>;
};

export type StreamableReasoning = {
  type: "reasoning";
  stream: AsyncIterable<string>;
};

// TODO: This name is kinda silly
// kaboom: This was promised to us 7000 years ago
export type PromisedFunctionCall = {
  type: "function_call";
  originalCall: ResponseFunctionToolCall;
  promise: Promise<
    Record<string, unknown>
  >; /** Contains the arguments of the function call */
};

export type StreamableItem =
  | StreamableMessage
  | StreamableReasoning
  | PromisedFunctionCall
  | ResponseOutputItem;

const MAX_COMPACTION_ATTEMPTS = 8; // TODO: make this configurable

export class LLMSession {
  private apiSetup: ApiSetup;
  private configManager: ConfigManager;
  private history: ResponseInput;
  private client: OpenAI;
  private onNotify?: (message: string) => void;
  private historyTokens?: number;

  constructor(
    apiSetup: ApiSetup,
    configManager: ConfigManager,
    onNotify?: (message: string) => void,
  ) {
    this.apiSetup = apiSetup;
    this.configManager = configManager;
    this.history = [];
    this.client = new OpenAI({
      apiKey: apiSetup.apiKey,
      baseURL: apiSetup.baseUrl,
    });
    this.onNotify = onNotify;
  }

  get tokens() {
    return this.historyTokens ?? 0;
  }

  addMessage(message: ResponseInputItem) {
    this.history.push(message);
  }

  async *call(retryNumber: number = 0): AsyncGenerator<StreamableItem> {
    if (
      this.apiSetup.compaction &&
      this.historyTokens &&
      this.apiSetup.compaction.maxTokens < this.historyTokens
    ) {
      if (this.onNotify)
        this.onNotify(`Compacting history... (${this.historyTokens} tokens)`);
      const previousTokens = this.historyTokens;
      let attempts = 0;
      let compacted = {
        history: this.history,
        tokens: this.historyTokens,
      };
      while (
        compacted.tokens >
          this.apiSetup.compaction.maxTokens *
            this.apiSetup.compaction.targetRatio &&
        attempts < MAX_COMPACTION_ATTEMPTS
      ) {
        compacted = await compact(
          compacted.history,
          compacted.tokens,
          this.apiSetup.compaction.strategy,
        );
        attempts += 1;
      }

      this.history = compacted.history;
      this.historyTokens = compacted.tokens;
      if (this.onNotify)
        this.onNotify(
          `Compacted history after ${attempts} attempts. (${previousTokens - this.historyTokens} tokens saved / ${Math.round((1 - compacted.tokens / previousTokens) * 100)}% reduction)`,
        );
    }

    let responseStream;
    try {
      responseStream = await this.client.responses.stream({
        model: this.apiSetup.model?.id,
        input: this.history,
        tools: toolRegistry.getTools().map((tool) => tool.definition),
        max_output_tokens: 16384, // TODO: Find a better way to adjust this
        instructions:
          "You are an helpful AI agent and not running in a sandbox. Everything tool you call will be run on the user's machine.",
      });

      const itemQueue = new AsyncQueue<StreamableItem>();
      let currentTextQueue: AsyncQueue<string> | null = null;
      let currentReasoningQueue: AsyncQueue<string> | null = null;
      let resolveCurrentFunctionCall:
        ((value: Record<string, unknown>) => void) | null = null;

      // When an output item begins, create its delta queue and yield the item to the outer stream
      responseStream.on("response.output_item.added", (event) => {
        if (event.item.type === "message") {
          currentTextQueue = new AsyncQueue<string>();
          itemQueue.push({
            type: "message",
            stream: currentTextQueue,
          });
        } else if (event.item.type === "reasoning") {
          currentReasoningQueue = new AsyncQueue<string>();
          itemQueue.push({
            type: "reasoning",
            stream: currentReasoningQueue,
          });
        } else if (event.item.type === "function_call") {
          itemQueue.push({
            type: "function_call",
            originalCall: event.item,
            promise: new Promise<Record<string, unknown>>((resolve) => {
              resolveCurrentFunctionCall = resolve;
            }),
          });
        } else {
          // Other items
          itemQueue.push(event.item);
        }
      });

      // Route text and reasoning chunks to their respective active queues
      responseStream.on("response.output_text.delta", (event) => {
        currentTextQueue?.push(event.delta);
      });

      responseStream.on(
        "response.reasoning_text.delta",
        (event: ResponseReasoningTextDeltaEvent) => {
          currentReasoningQueue?.push(event.delta);
        },
      );

      // Close the inner chunk queue when the output item completes
      responseStream.on("response.output_item.done", (event) => {
        if (event.item.type === "message") {
          currentTextQueue?.done();
          currentTextQueue = null;
        } else if (event.item.type === "reasoning") {
          currentReasoningQueue?.done();
          currentReasoningQueue = null;
        } else if (event.item.type === "function_call") {
          resolveCurrentFunctionCall?.(JSON.parse(event.item.arguments));
          resolveCurrentFunctionCall = null;
        }
      });

      // This will forward any errors
      const finalResponsePromise = responseStream
        .finalResponse()
        .then((res) => {
          itemQueue.done();
          return res;
        })
        .catch((err) => {
          itemQueue.fail(err);
          throw err;
        });

      yield* itemQueue;

      const response = await finalResponsePromise;

      this.historyTokens = response.usage?.total_tokens;

      let recallNecessary = false;

      for (const step of response.output) {
        // These steps are incompatible with the input item type, so skip them
        if (
          step.type === "computer_call_output" ||
          step.type === "additional_tools"
        )
          continue;

        this.history.push(step);

        if (step.type == "function_call") {
          recallNecessary = true;

          const tool = toolRegistry.get(step.name);

          if (!tool) {
            console.warn(`Unknown tool: ${step.name}`);
            this.history.push({
              type: "function_call_output",
              call_id: step.call_id,
              output: JSON.stringify({
                error: `Tool ${step.name} not found`,
              }),
            });
            continue;
          }

          const args = JSON.parse(step.arguments) as Record<string, unknown>;

          if (step.name === "webSearch") {
            args.apiKey =
              await this.configManager.getProviderApiKey("Hack Club AI");
          }

          if (step.name === "webFetch") {
            args.apiKey =
              await this.configManager.getProviderApiKey("Hack Club AI");
          }

          const result = await tool.execute(args);

          if (
            result.success &&
            result.data &&
            typeof result.data === "object" &&
            "isImage" in result.data &&
            (result.data as ReadFileImageResult).isImage === true
          ) {
            this.history.push({
              type: "function_call_output",
              call_id: step.call_id,
              output: [
                {
                  type: "input_image",
                  image_url: (result.data as ReadFileImageResult).data,
                },
              ],
            });
          } else {
            this.history.push({
              type: "function_call_output",
              call_id: step.call_id,
              output: JSON.stringify(result),
            });
          }
        }
      }

      if (recallNecessary) {
        // This is done because some providers require the last message to be from the user
        // and function_call_output is considered a model turn
        this.history.push({
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "Continue." }],
        });
        yield* this.call();
      }
    } catch (e) {
      if (e instanceof APIError) {
        console.error(`API Error (${e.status}): ${e.message}`);
        if (e.error) {
          console.error(e.error);
        }
      } else if (e instanceof Error) {
        console.error(`Error(): ${e.message}`);
      } else {
        console.error("An unexpected error occurred:", e);
      }
      if (this.apiSetup.autoRetry) {
        if (
          (this.apiSetup.autoRetry.maxRetries === -1 ||
            retryNumber < this.apiSetup.autoRetry.maxRetries) &&
          isRetryableError(e)
        ) {
          // Calculate delay
          const delayMs =
            this.apiSetup.autoRetry.delayMs *
            Math.pow(this.apiSetup.autoRetry.delayIncreaseFactor, retryNumber);

          if (this.onNotify)
            this.onNotify(
              `API call failed. Retrying in ${delayMs}ms (attempt ${retryNumber + 1}/${this.apiSetup.autoRetry.maxRetries})`,
            );

          // Wait
          await Bun.sleep(delayMs);
          // Recurse
          yield* this.call(retryNumber + 1);
          return;
        }
      } else {
        console.log("NO AUTO RETRY");
      }
      throw e;
    }
  }
}
