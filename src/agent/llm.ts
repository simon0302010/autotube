import OpenAI, { APIError } from "openai";
import type {
  ResponseInput,
  ResponseInputItem,
  ResponseOutputItem,
} from "openai/resources/responses/responses.mjs";
import { toolRegistry } from "./tools/toolRegistry";
import "./tools";

export interface ApiSetup {
  apiKey: string;
  baseUrl: string;
  model?: string;
}

export class LLMSession {
  apiSetup: ApiSetup;
  history: ResponseInput;
  client: OpenAI;

  constructor(apiSetup: ApiSetup) {
    this.apiSetup = apiSetup;
    this.history = [];
    this.client = new OpenAI({
      apiKey: apiSetup.apiKey,
      baseURL: apiSetup.baseUrl,
    });
  }

  addMessage(message: ResponseInputItem) {
    this.history.push(message);
  }

  async *call(): AsyncGenerator<ResponseOutputItem> {
    let response;
    try {
      response = await this.client.responses.create({
        model: this.apiSetup.model,
        input: this.history,
        tools: toolRegistry.getTools().map((tool) => tool.definition),
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

        const args: unknown = JSON.parse(step.arguments);
        const result = await tool.execute(args);

        this.history.push({
          type: "function_call_output",
          call_id: step.call_id,
          output: JSON.stringify(result),
        });
      }
    }

    if (recallNecessary) {
      yield* response.output;
      yield* this.call();
    }

    yield* response.output;
  }
}
