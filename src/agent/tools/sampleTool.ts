import { BaseTool, RegisterTool, type ToolMetadata } from "./tool";

type SamplePayload = void;
type SampleData = string;

@RegisterTool()
export class SampleTool extends BaseTool<SamplePayload, SampleData> {
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

    return {
      success: true,
      data: "Successfully executed",
    };
  }
}
