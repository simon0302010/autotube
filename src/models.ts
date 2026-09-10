import { password, select } from "@inquirer/prompts";

interface ModelInfo {
    id: string,
    name: string,
    created: number,
    context_length: number,
    description: string
}

interface ModelList {
    data: ModelInfo[],
    total_count: number
}

interface ApiSetup {
    endpoint: string,
    apiKey: string
}

export async function askProvider(): Promise<[ApiSetup, ModelList]> {
    const providers: readonly string[] = ["Hack Club AI", "OpenAI", "OpenRouter"];
    const provider = await select({message: "Please select your AI provider", choices: providers});

    let endpoint: string;

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
        },
        signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
        const apiSetup: ApiSetup = {endpoint, apiKey}
        const models = await response.json() as ModelList;

        return [apiSetup, models];
    } else {
        if (response.status == 401) {
            return askProvider();
        }

        console.error(`Failed to get models from provider: ${response.status}`);
        process.exit(1);
    }
}