#!/usr/bin/env bun

import { select } from "@inquirer/prompts";

const providers: readonly string[] = ["Hack Club AI", "OpenAI", "OpenRouter"];
const provider = await select({message: "Please select your AI provider", choices: providers});

let endpoint: string | undefined;

switch (provider) {
    case "Hack Club AI":
        endpoint = "https://ai.hackclub.com/proxy/v1";
        break;
    case "OpenAI":
        endpoint = "https://api.openai.com/v1";
        break;
    case "OpenRouter":
        endpoint = "https://openrouter.ai/api/v1";
        break;
}

console.log(endpoint);