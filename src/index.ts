#!/usr/bin/env bun

import { ConfigManager } from "./config";
import { completionRequest } from "./agent/llm";
import { Tui } from "./tui";
import { TOML } from "bun";

async function main() {
  // TODO: Add CL argument for configs and to specify a certain config file path
  let config = {};
  try {
    const file = Bun.file("./config.toml");
    config = TOML.parse(await file.text());
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code !== "ENOENT") {
      throw e; // This is unexpected...
    }
  }
  // TODO: Check if user prefers a TUI or headless session (perhaps with a simple -y flag?)
  const configManager = new ConfigManager(config, false);

  // In a headed environment, this will prompt the user for missing config info
  await configManager.validate();

  const apiSetup = await configManager.getApiSetup();
  if (!apiSetup) throw new Error("API setup failed");

  console.log(await completionRequest(apiSetup, "What color is the sky?"));

  // This just initialises the class. Everything else is done in tui.buildAndRun()
  // Feel free to improve this if you think there is a more elegant way to achieve the same end result.
  // const tui = new Tui();
  // tui.buildAndRun();
}

main();
