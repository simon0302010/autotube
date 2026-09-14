import { toolRegistry } from "./toolRegistry";
import type { Tool } from "openai/resources/responses/responses.mjs";

// This can be expanded as more metadata is needed
export interface ToolMetadata {
  definition: Tool;
}

export interface ToolConstructor {
  new (...args: unknown[]): BaseTool;
  metadata: ToolMetadata;
}

/**
 * @param name Should match function name in tool definition
 */
export function RegisterTool(name: string) {
  return function <T extends ToolConstructor>(target: T) {
    toolRegistry.register(name, target);

    if (!target.metadata)
      throw new Error("Tools must have static variable 'METADATA'");
  };
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// TODO: Add a method for responses and/or logging
export abstract class BaseTool<TPayload = unknown, TData = unknown> {
  abstract execute(payload: TPayload): Promise<ToolResult<TData>>;
}
