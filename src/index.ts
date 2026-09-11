#!/usr/bin/env bun

import { ConfigManager } from "./config";
import { Tui } from "./tui";

async function main() {
  // TODO: Check for a config file or individual options passed in CL arguments
  // TODO: Check if user prefers a TUI or headless session (perhaps with a simple -y flag?)
  const configManager = new ConfigManager({}, false);

  // In a headed environment, this will prompt the user for missing config info
  await configManager.validate();

  // This just initialises the class. Everything else is done in tui.buildAndRun()
  // Feel free to improve this if you think there is a more elegant way to achieve the same end result.
  const tui = new Tui();

  tui.buildAndRun();
}

main();
