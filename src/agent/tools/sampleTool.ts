import { BaseTool, RegisterTool, type ToolMetadata } from "./tool";

@RegisterTool()
export class SampleTool extends BaseTool {
  static metadata: ToolMetadata = {
    definition: {
      type: "function",
      function: {
        name: "SampleTool",
        description: "Sample tool",
      },
    },
  };

  async execute() {
    console.log("Hello world!");
  }
}
