import {
  BaseTool,
  RegisterTool,
  type ToolMetadata,
  type ToolResult,
} from "./tool";

interface WebSearchParams {
  apiKey?: string;
  query: string;
  country?: string;
  search_lang?: string;
  count?: number;
  offset?: number;
  safesearch?: string;
  freshness?: string;
  extra_snippets?: boolean;
  result_filter?: string;
}

interface WebSearchResult {
  title: string;
  url: string;
  description: string;
  snippets?: string[];
}

interface WebSearchData {
  results: WebSearchResult[];
}

interface SearchResponse {
  results?: {
    title: string;
    url: string;
    description: string;
    extra_snippets?: string[];
  }[];
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
            description: "Hack Club search API key",
          },
          query: {
            type: "string",
            description: "Search query (max 400 characters, 50 words)",
          },
          country: {
            type: "string",
            description: "Country code for results (default: US)",
          },
          search_lang: {
            type: "string",
            description: "Search language (default: en)",
          },
          count: {
            type: "number",
            description: "Number of results (max 20, default 20)",
          },
          offset: {
            type: "number",
            description: "Pagination offset",
          },
          safesearch: {
            type: "string",
            description: "SafeSearch filter: off, moderate, or strict",
          },
          freshness: {
            type: "string",
            description: "Time filter: pd (24h), pw (7d), pm (31d), py (365)",
          },
        },
        required: ["query", "apiKey"],
      },
      strict: true,
    },
  };

  async execute(payload: WebSearchParams): Promise<ToolResult<WebSearchData>> {
    const {
      apiKey,
      query,
      country = "US",
      search_lang = "en",
      count = 20,
      offset = 0,
      safesearch = "moderate",
      freshness,
      extra_snippets,
      result_filter,
    } = payload;

    if (!apiKey) {
      return {
        success: false,
        error: "Hack Club search API key not configured",
      };
    }

    const params = new URLSearchParams({
      q: query,
      country,
      search_lang,
      count: count.toString(),
      offset: offset.toString(),
      safesearch,
    });

    if (freshness) {
      params.set("freshness", freshness);
    }
    if (extra_snippets) {
      params.set("extra_snippets", "true");
    }
    if (result_filter) {
      params.set("result_filter", result_filter);
    }

    const apiUrl = `https://search.hackclub.com/res/v1/web/search?${params}`;
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
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
      description: r.description,
      snippets: r.extra_snippets,
    }));

    return {
      success: true,
      data: {
        results,
      },
    };
  }
}
