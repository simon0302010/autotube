import { toolRegistry } from "./toolRegistry";
import type { ToolMetadata, ToolResult } from "./tool";

interface WebSearchParams {
  apiKey?: string | null;
  query: string;
  numResults?: number | null;
}

interface WebSearchResult {
  title: string;
  url: string;
  //description: string;
}

interface WebSearchData {
  results: WebSearchResult[];
}

interface SearchResponse {
  requestId: string;
  results: {
    id: string;
    title: string;
    url: string;
  }[];
  searchTime: number;
}

export const webSearchTool: ToolMetadata<WebSearchParams, WebSearchData> = {
  definition: {
    type: "function",
    name: "webSearch",
    description: "Search the web for pages, videos, etc.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (max 400 characters)",
        },
        numResults: {
          type: ["number", "null"],
          description: "Number of Results (default 5)",
        },
      },
      required: ["query", "numResults"],
      additionalProperties: false,
    },
    strict: true,
  },
  execute: async (
    payload: WebSearchParams,
  ): Promise<ToolResult<WebSearchData>> => {
    const { apiKey, query } = payload;
    const numResults = payload.numResults ?? 5;

    if (!apiKey) {
      return {
        success: false,
        error: "Hack Club AI API key not configured",
      };
    }

    const apiUrl = `https://ai.hackclub.com/proxy/v1/exa/search`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // TODO: Add all arguments available from API
      body: JSON.stringify({
        query: query,
        numResults: numResults,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Search API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = (await response.json()) as SearchResponse;

    const results: WebSearchResult[] = (data.results ?? []).map((r) => ({
      title: r.title,
      url: r.url,
      //description: r.description,
    }));

    return {
      success: true,
      data: {
        results,
      },
    };
  },
};

toolRegistry.register("webSearch", webSearchTool);
