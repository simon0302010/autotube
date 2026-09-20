import { toolRegistry } from "./toolRegistry";
import type { ToolMetadata, ToolResult } from "./tool";
import path from "path";
import { bgBlue } from "@opentui/core";

interface ReadFileParams {
  path: string;
}

interface ReadFileImageResult {
  isImage: true;
  data: string;
}

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"];
const MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export const readFileTool: ToolMetadata<
  ReadFileParams,
  string | ReadFileImageResult
> = {
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
  execute: async (
    payload: ReadFileParams,
  ): Promise<ToolResult<string | ReadFileImageResult>> => {
    const resolvedPath = path.resolve(payload.path);
    const file = Bun.file(resolvedPath);

    if (!(await file.exists())) {
      return {
        success: false,
        error: `File not found: ${payload.path}`,
      };
    }

    const extension = path.extname(resolvedPath).toLowerCase();

    if (IMAGE_EXTENSIONS.includes(extension)) {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mime = MIME_MAP[extension] ?? "image/png";

      return {
        success: true,
        data: {
          isImage: true,
          data: `data:${mime};base64,${base64}`,
        },
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
