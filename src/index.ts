#!/usr/bin/env bun

import { password, select } from "@inquirer/prompts";

askProvider();

async function askProvider(): Promise<[string, string] | undefined> {
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
        default:
            console.error("Provider not found");
            process.exit(1);
    }

    const apiKey = await password({message: "Please input your API key", toggleMask: true});

    const response = await fetch(`${endpoint}/models`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + apiKey
        }
    });

    if (!response.ok) {
        console.error(`Failed to get models from provider: ${response.status}`);
        process.exit(1);
    }

    const models = await response.json();

    console.log(models);

    return undefined;
}