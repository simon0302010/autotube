export interface Provider {
  baseUrl: string;
  type: "openai" | "anthropic"
}

export type Providers = Record<string, Provider>;

export const defaultProviders: Providers = {
  "Hack Club AI": {
    baseUrl: "https://ai.hackclub.com/proxy/v1",
    type: "openai"
  },
  OpenAI: {
    baseUrl: "https://api.openai.com/v1",
    type: "openai"
  },
  OpenRouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    type: "openai"
  },
};
