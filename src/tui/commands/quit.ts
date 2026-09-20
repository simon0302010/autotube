import type { Command } from "./command";

export const quit: Command = {
  name: "quit",
  aliases: ["q", "exit"],
  handler: (_input, tui) => {
    tui.destroy();
  },
};
