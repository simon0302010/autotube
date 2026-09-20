import { config } from "./config";
import { quit } from "./quit";
import { tokens } from "./tokens";

export { runCommand } from "./command";

export const COMMAND_LIST = [quit, tokens, config];
