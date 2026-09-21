import { webFetchTool } from "../webFetch";
import { ConfigManager } from "../../../config";

const configManager = new ConfigManager();
await configManager.validate();

const apiKey = await configManager.getProviderApiKey("Hack Club AI");

const result = await webFetchTool.execute({
  apiKey: apiKey,
  url: "https://github.com/utkrstht",
});
console.log(result);
