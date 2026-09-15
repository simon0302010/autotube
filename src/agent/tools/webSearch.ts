import {
  BaseTool,
  RegisterTool,
  type ToolMetadata,
  type ToolResult,
} from "./tool";

interface WebSearchParams {
  // API key is marked optional otherwise TypeScript gets all angry since configManager.config.hackclubSearchApiKey is either undefined or a string.
  // However there is an if statement down below which throws an error if apiKey does not exist, so don't worry :p
  apiKey?: string;
  query: string;
  numResults: number;
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

@RegisterTool("webSearch")
export class WebSearchTool extends BaseTool<WebSearchParams, WebSearchData> {
  static metadata: ToolMetadata = {
    definition: {
      type: "function",
      name: "webSearch",
      description: "Search the web for pages, videos, etc.",
      parameters: {
        type: "object",
        properties: {
          apiKey: {
            type: "string",
            description: "Hack Club AI API Key (for Exa search proxy)",
          },
          query: {
            type: "string",
            description: "Search query (max 400 characters)",
          },
          numResults: {
            type: "number",
            description: "Number of Results (default 5)",
          },
        },
        required: ["query", "apiKey"],
      },
      strict: true,
    },
  };

  async execute(payload: WebSearchParams): Promise<ToolResult<WebSearchData>> {
    const { apiKey, query, numResults = 5 } = payload;

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
      body: JSON.stringify({
        query: query,
        numResults: numResults, // TODO: Add argument to control the number of results
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
  }
}
