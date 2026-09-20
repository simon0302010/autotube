import { toolRegistry } from "./toolRegistry";
import type { ToolMetadata, ToolResult } from "./tool";

interface WebFetchParams {
  apiKey?: string | null;
  url: string;
}

interface WebFetchResult {
  title: string;
  url: string;
  content: string;
}

interface ExaContentResponse {
  results: {
    title: string;
    url: string;
    text: string;
  }[];
}

export const webFetchTool: ToolMetadata<WebFetchParams, WebFetchResult> = {
  definition: {
    type: "function",
    name: "webFetch",
    description: "Fetch the text content of a web page URL",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to fetch from",
        },
      },
      required: ["url"],
      additionalProperties: false,
    },
    strict: true,
  },
  execute: async (
    payload: WebFetchParams,
  ): Promise<ToolResult<WebFetchResult>> => {
    const { apiKey, url } = payload;

    if (!apiKey) {
      return {
        success: false,
        error: "Hack Club AI API key not configured",
      };
    }

    const apiUrl = "https://ai.hackclub.com/proxy/v1/exa/contents";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls: [url] }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Web Fetch API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = (await response.json()) as ExaContentResponse;
    const result = data.results?.[0];

    if (!result) {
      return {
        success: false,
        error: "No content returned for URL",
      };
    }

    return {
      success: true,
      data: {
        title: result.title,
        url: result.url,
        content: result.text,
      },
    };
  },
};

toolRegistry.register("webFetch", webFetchTool);
