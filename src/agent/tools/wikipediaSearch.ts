import { toolRegistry } from "./toolRegistry";
import type { ToolMetadata, ToolResult } from "./tool";

interface SearchParams {
  query: string;
  limit?: number | null;
}

interface SearchResult {
  title: string;
  pageid: number;
  snippet: string;
  wordcount: string;
}

interface SearchResponse {
  query: {
    search: SearchResult[];
  };
}

export const wikipediaSearchTool: ToolMetadata<SearchParams, SearchResult[]> = {
  definition: {
    type: "function",
    name: "wikipediaSearch",
    description:
      "Searchs Wikipedia for articles matching given query, returns a list of titles and snippets of matching articles.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The query for searching articles",
        },
        limit: {
          type: ["number", "null"],
          description: "Maximum number of results to return (default: 5)",
        },
      },
      required: ["query", "limit"],
      additionalProperties: false,
    },
    strict: true,
  },

  execute: async (
    payload: SearchParams,
  ): Promise<ToolResult<SearchResult[]>> => {
    const { query } = payload;
    const limit = payload.limit ?? 5;

    const params = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: limit.toString(),
      format: "json",
      origin: "*",
    });

    const apiUrl = `https://en.wikipedia.org/w/api.php?${params}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return {
        success: false,
        error: `Wikipedia API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = (await response.json()) as SearchResponse;
    return { success: true, data: data.query.search };
  },
};

toolRegistry.register("wikipediaSearch", wikipediaSearchTool);
