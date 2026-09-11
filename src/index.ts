#!/usr/bin/env bun

import OpenAI, { APIError } from "openai";
import { ConfigManager } from "./config";
import {
  BoxRenderable,
  createCliRenderer,
  InputRenderable,
  TextRenderable,
} from "@opentui/core";
import { Tui } from "./tui";

async function main() {
  // TODO: Check for a config file or individual options passed in CL arguments
  // TODO: Check if user prefers a TUI or headless session (perhaps with a simple -y flag?)
  const configManager = new ConfigManager({}, false);

  // In a headed environment, this will prompt the user for missing config info
  // await configManager.validate();

  // this asks the user for api credentials and model id (pretty much done)
  // const [apiSetup, models] = await setupProvider();

  // this runs a really basic tui
  const tui = await Tui.create();

  tui.runTui();
}

main();
