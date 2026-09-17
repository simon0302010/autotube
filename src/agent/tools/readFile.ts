import { toolRegistry } from "./toolRegistry";
import type { ToolMetadata, ToolResult } from "./tool";
import path from "path";

interface ReadFileParams {
  path: string;
}

export const readFileTool: ToolMetadata<ReadFileParams, string> = {
  definition: {
    type: "function",
    name: "readFile",
    description: "Read file and return file's contents",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute path to the file",
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
    strict: true,
  },
  execute: async (payload: ReadFileParams): Promise<ToolResult<string>> => {
    const resolvedPath = path.resolve(payload.path);
    const file = Bun.file(resolvedPath);

    if (!(await file.exists())) {
      return {
        success: false,
        error: `File not found: ${payload.path}`,
      };
    }

    const content = await file.text();
    return {
      success: true,
      data: content,
    };
  },
};

toolRegistry.register("readFile", readFileTool);
