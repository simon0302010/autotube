#!/usr/bin/env bun

import OpenAI, { APIError } from "openai";
import { setupProvider } from "./models";
import {
  BoxRenderable,
  createCliRenderer,
  InputRenderable,
  TextRenderable,
} from "@opentui/core";
import { runTui } from "./tui";

// this asks the user for api credentials and model id (pretty much done)
// const [apiSetup, models] = await setupProvider();

// this runs a really basic tui
runTui();
