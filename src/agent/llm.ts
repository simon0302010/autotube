import OpenAI, { APIError } from "openai";
import type {
  ResponseInput,
  ResponseInputItem,
  ResponseOutputItem,
  ResponseReasoningTextDeltaEvent,
} from "openai/resources/responses/responses.mjs";
import type { ConfigManager } from "../config";
import { toolRegistry } from "./tools/toolRegistry";
import "./tools";
import { AsyncQueue } from "../utils";
import type { Config } from "eslint/config";

export interface ApiSetup {
  apiKey: string;
  baseUrl: string;
  model?: string;
}

export type StreamableMessage = {
  type: "message";
  stream: AsyncIterable<string>;
};

export type StreamableReasoning = {
  type: "reasoning";
  stream: AsyncIterable<string>;
};

export type StreamableItem =
  StreamableMessage | StreamableReasoning | ResponseOutputItem;

export class LLMSession {
  apiSetup: ApiSetup;
  configManager: ConfigManager;
  history: ResponseInput;
  client: OpenAI;

  constructor(apiSetup: ApiSetup, configManager: ConfigManager) {
    this.apiSetup = apiSetup;
    this.configManager = configManager;
    this.history = [];
    this.client = new OpenAI({
      apiKey: apiSetup.apiKey,
      baseURL: apiSetup.baseUrl,
    });
  }

  addMessage(message: ResponseInputItem) {
    this.history.push(message);
  }

  async *call(): AsyncGenerator<StreamableItem> {
    let responseStream;
    try {
      responseStream = await this.client.responses.stream({
        model: this.apiSetup.model,
        input: this.history,
        tools: toolRegistry.getTools().map((tool) => tool.definition),
        max_output_tokens: 16384, // TODO: Find a better way to adjust this
        instructions:
          "You are an helpful AI agent and not running in a sandbox. Everything tool you call will be run on the user's machine.",
      });
    } catch (e) {
      if (e instanceof APIError) {
        console.error(`API Error (${e.status}): ${e.message}`);
        if (e.error) {
          console.error(e.error);
        }
      } else if (e instanceof Error) {
        console.error(`Error: ${e.message}`);
      } else {
        console.error("An unexpected error occurred:", e);
      }
      throw e;
    }

    const itemQueue = new AsyncQueue<StreamableItem>();
    let currentTextQueue: AsyncQueue<string> | null = null;
    let currentReasoningQueue: AsyncQueue<string> | null = null;

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
      } else {
        // e.g. function_call or other items
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

        const result = await tool.execute(args);

        this.history.push({
          type: "function_call_output",
          call_id: step.call_id,
          output: JSON.stringify(result),
        });
      }
    }

    if (recallNecessary) {
      yield* this.call();
    }
  }
}
