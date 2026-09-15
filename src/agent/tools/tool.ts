import type { Tool } from "openai/resources/responses/responses.mjs";

// This can be expanded as more metadata is needed
export interface ToolMetadata<TPayload = unknown, TData = unknown> {
  definition: Tool;
  execute: (payload: TPayload) => Promise<ToolResult<TData>>;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
