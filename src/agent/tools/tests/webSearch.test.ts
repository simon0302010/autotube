import { config } from "typescript-eslint";
import { ConfigManager } from "../../../config";
import { WebSearchTool } from "../webSearch";

const configManager = new ConfigManager();
await configManager.validate();

// This may appear as an undefined method but the big simon is about to push the method 😍😍😍
const apiKey = configManager.getProviderApiKey("Hack Club AI");

const tool = new WebSearchTool();
const result = await tool.execute({
  apiKey: apiKey,
  query: "the big kaboom of 1986",
  numResults: 5,
});
console.log(result);
