import type { ToolConstructor } from "./tool";

class ToolRegistry {
  registry: Record<string, ToolConstructor>;

  constructor() {
    this.registry = {};
  }

  register(name: string, tool: ToolConstructor) {
    this.registry[name] = tool;
  }

  get(name: string): ToolConstructor | undefined {
    return this.registry[name];
  }

  getTools(): ToolConstructor[] {
    return Object.values(this.registry);
  }
}

export const toolRegistry = new ToolRegistry();
