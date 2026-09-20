import type { Command } from "./command";

export const tokens: Command = {
  name: "tokens",
  handler: (_input, tui) => {
    if (!tui.getTokens) {
      tui.displayNotification("No token information available", 3000);
      return;
    }
    tui.displayNotification(`${tui.getTokens()} tokens used`, 3000);
    return;
  },
};
