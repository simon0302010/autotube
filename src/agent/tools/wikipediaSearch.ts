import { BaseTool, RegisterTool, type ToolMetadata, type ToolResult } from "./tool";

interface SearchParams {
  query: string;
  limit?: number;
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

@RegisterTool()
export class WikipediaSearchTool extends BaseTool<SearchParams, SearchResult[]> {
  static metadata: ToolMetadata = {
    definition: {
      type: "function",
      function: {
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
              type: "number",
              description: "Maximum number of results to return (default: 5)",
            },
          },
          required: ["query"],
        },
      },
    },
  };

  async execute(payload: SearchParams): Promise<ToolResult<SearchResult[]>> {
    const { query, limit = 5 } = payload;

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
  }
}
