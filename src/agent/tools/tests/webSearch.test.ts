import { ConfigManager } from "../../../config";

const configManager = new ConfigManager();
await configManager.validate();

// You can now use configManager
