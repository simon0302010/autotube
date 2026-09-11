export interface Provider {
  baseUrl: string;
}

export type Providers = Record<string, Provider>;

export const defaultProviders: Providers = {
  "Hack Club AI": {
    baseUrl: "https://ai.hackclub.com/proxy/v1",
  },
  OpenAI: {
    baseUrl: "https://api.openai.com/v1",
  },
  OpenRouter: {
    baseUrl: "https://openrouter.ai/api/v1",
  },
};
