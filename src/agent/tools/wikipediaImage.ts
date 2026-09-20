import { toolRegistry } from "./toolRegistry";
import type { ToolMetadata, ToolResult } from "./tool";
import { ENV_PATHS } from "../..";
import path from "path";
import { mkdir } from "node:fs/promises";

interface DownloadImagesParams {
  title: string;
}

interface DownloadImageResult {
  title: string;
  url: string;
  localPath: string;
  width: number;
  height: number;
}

interface ImageResponse {
  query: {
    pages: Record<
      string,
      { imageinfo?: { url: string; width: number; height: number }[] }
    >;
  };
}

export const downloadWikipediaImageTool: ToolMetadata<
  DownloadImagesParams,
  DownloadImageResult
> = {
  definition: {
    type: "function",
    name: "downloadWikipediaImage",
    description:
      "Download a Wikipedia image by it's file title (e.g. File:Mona_Lisa.jpg)",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Wikipedia image file title",
        },
      },
      required: ["title"],
      additionalProperties: false,
    },
    strict: true,
  },

  execute: async (
    payload: DownloadImagesParams,
  ): Promise<ToolResult<DownloadImageResult>> => {
    const { title } = payload;

    const infoParams = new URLSearchParams({
      action: "query",
      titles: title,
      prop: "imageinfo",
      iiprop: "url|size",
      format: "json",
      origin: "*",
    });
    const infoUrl = `https://en.wikipedia.org/w/api.php?${infoParams}`;

    const infoResponse = await fetch(infoUrl, {
      headers: { "User-Agent": "Autotube/1.1 (utkrishth@utkrishth.in)" },
    });

    if (!infoResponse.ok) {
      return {
        success: false,
        error: `Wikipedia API error: ${infoResponse.status} ${infoResponse.statusText}`,
      };
    }

    const infoData = (await infoResponse.json()) as ImageResponse;

    const pages = Object.values(infoData.query.pages);
    const info = pages[0]?.imageinfo?.[0];

    if (!info) {
      return {
        success: false,
        error: `Image not found ${title}`,
      };
    }

    await mkdir(ENV_PATHS.temp, { recursive: true });

    const extension = path.extname(new URL(info.url).pathname) || ".png";
    const sanitizedName = title
      .replace(/^File:/i, "")
      .replace(/[^\w.-]/g, "_")
      .replace(/_+/g, "_");
    const filename = `${sanitizedName}_${Date.now()}${extension}`;
    const localPath = path.join(ENV_PATHS.temp, filename);

    try {
      const imageResponse = await fetch(info.url, {
        headers: { "User-Agent": "Autotube/1.1 (utkrishth@utkrishth.in)" },
      });

      if (!imageResponse.ok) {
        return {
          success: false,
          error: `Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`,
        };
      }

      const blob = await imageResponse.blob();
      await Bun.write(localPath, blob);
    } catch {
      return {
        success: false,
        error: `Failed to download image`,
      };
    }

    return {
      success: true,
      data: {
        title,
        url: info.url,
        localPath,
        width: info.width,
        height: info.height,
      },
    };
  },
};

toolRegistry.register("downloadWikipediaImage", downloadWikipediaImageTool);
