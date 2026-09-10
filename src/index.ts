#!/usr/bin/env bun

import { askProvider } from "./models";

const [apiSetup, models] = await askProvider();