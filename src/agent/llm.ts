import OpenAI from "openai";
import type {
  ResponseInput,
  ResponseInputItem,
} from "openai/resources/responses/responses.mjs";
import { toolRegistry } from "./tools/toolRegistry";

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

  async call() {
    const response = await this.client.responses.create({
      model: this.apiSetup.model,
      input: this.history,
      tools: toolRegistry.getTools().map((tool) => tool.metadata.definition),
    });

    for (const step of response.output) {
      if (step.type == "message") {
        this.history.push(step);
      } else if (step.type == "function_call") {
        // TODO: Handle tool calling
      }
    }

    return response;
  }
}
