import type { Tui } from "..";

export interface Command {
  name: string;
  aliases?: string[];
  handler: (_input: string, tui: Tui) => void;
}

export function runCommand(
  commandList: Command[],
  command: string,
  _input: string,
  tui: Tui,
): boolean {
  for (const cmd of commandList) {
    if (cmd.name === command || cmd.aliases?.includes(command)) {
      cmd.handler(_input, tui);
      return true;
    }
  }

  return false;
}
