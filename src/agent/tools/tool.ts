import type { ChatCompletionTool } from "openai/resources";

// This can be expanded as more metadata is needed
export interface ToolMetadata {
  definition: ChatCompletionTool;
}

interface ToolConstructor {
  new (...args: unknown[]): BaseTool;
  metadata: ToolMetadata;
}

export function RegisterTool() {
  // TODO: Also register tools in the registry
  return function <T extends ToolConstructor>(target: T) {
    if (!target.metadata)
      throw new Error("Tools must have static variable 'METADATA'");
  };
}

// TODO: Add a method for responses and/or logging
export abstract class BaseTool {
  abstract execute(payload: unknown): Promise<void>;
}
