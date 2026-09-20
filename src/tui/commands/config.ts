import open from "open";
import type { Command } from "./command";
import { ENV_PATHS } from "../..";

export const config: Command = {
  name: "config",
  aliases: ["cfg"],
  handler: (_input, tui) => {
    (async () => {
      try {
        await open(ENV_PATHS.config);
        tui.displayNotification("Opened config directory", 3000);
      } catch (e) {
        tui.displayNotification("Failed to open config directory", 3000);
        throw e;
      }
    })();
  },
};
