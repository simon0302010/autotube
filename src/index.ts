#!/usr/bin/env bun

import OpenAI, { APIError } from "openai";
import { askProvider } from "./models";
import { BoxRenderable, createCliRenderer, InputRenderable, TextRenderable } from "@opentui/core";

// this asks the user for api credentials and model id
// const [apiSetup, models] = await askProvider();

const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    backgroundColor: "#1131E9",
})

const panel = new BoxRenderable(renderer, {
    width: "100%",
    height: "100%",
    backgroundColor: "#1131E9",
    alignItems: "center",
    justifyContent: "flex-end",
})

const promptBar = new BoxRenderable(renderer, {
    width: "100%",
    height: 3,
    backgroundColor: "#142793",
    alignSelf: "flex-end",
    alignItems: "baseline",
    justifyContent: "center",
    margin: 1,
    marginLeft: 1
})

const promptInput = new InputRenderable(renderer, {
    id: "prompt-input",
    width: "100%",
    placeholder: "Enter your prompt...",
    marginLeft: 1
})

promptBar.add(promptInput);
panel.add(promptBar)
renderer.root.add(panel)

promptInput.focus();

renderer.keyInput.on("keypress", (key) => {
    if (key.name === "q") {
        renderer.destroy()
        return
    }
})