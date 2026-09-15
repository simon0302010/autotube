import type { ToolMetadata } from "./tool";

class ToolRegistry {
  registry: Record<string, ToolMetadata<unknown, unknown>>;

  constructor() {
    this.registry = {};
  }

  register<TPayload, TData>(name: string, tool: ToolMetadata<TPayload, TData>) {
    this.registry[name] = tool as unknown as ToolMetadata<unknown, unknown>;
  }

  get(name: string): ToolMetadata<unknown, unknown> | undefined {
    return this.registry[name];
  }

  getTools(): ToolMetadata<unknown, unknown>[] {
    return Object.values(this.registry);
  }
}

export const toolRegistry = new ToolRegistry();
export const toolsRegistry = toolRegistry;
