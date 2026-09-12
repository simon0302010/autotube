export interface Provider {
  baseUrl: string;
  type: "openai" | "anthropic";
  apiKeyVar: string;
}

export type Providers = Record<string, Provider>;

export const defaultProviders: Providers = {
  "Hack Club AI": {
    baseUrl: "https://ai.hackclub.com/proxy/v1",
    type: "openai",
    apiKeyVar: "HACKCLUB_API_KEY",
  },
  OpenAI: {
    baseUrl: "https://api.openai.com/v1",
    type: "openai",
    apiKeyVar: "OPENAI_API_KEY",
  },
  OpenRouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    type: "openai",
    apiKeyVar: "OPENROUTER_API_KEY",
  },
};
