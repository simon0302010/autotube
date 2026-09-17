import { webSearchTool } from "../webSearch";
import { ConfigManager } from "../../../config";

const configManager = new ConfigManager();
await configManager.validate();

const apiKey = await configManager.getProviderApiKey("Hack Club AI");

const result = await webSearchTool.execute({
  apiKey: apiKey,
  query: "the big kaboom of 1986",
  numResults: 5,
});
console.log(result);
