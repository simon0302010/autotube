import { password, search, select } from "@inquirer/prompts";

export interface ModelInfo {
    id: string,
    name: string,
    created: number,
    context_length: number,
    description: string
}

export interface ModelList {
    data: ModelInfo[],
    total_count: number
}

export interface ApiSetup {
    baseUrl: string,
    apiKey: string,
    model: string
}

export async function askProvider(): Promise<[ApiSetup, ModelList]> {
    const providers: readonly string[] = ["Hack Club AI", "OpenAI", "OpenRouter"];
    const provider = await select({message: "Select your AI provider", choices: providers});

    let baseUrl: string;

    switch (provider) {
        case "Hack Club AI":
            baseUrl = "https://ai.hackclub.com/proxy/v1";
            break;
        case "OpenAI":
            baseUrl = "https://api.openai.com/v1";
            break;
        case "OpenRouter":
            baseUrl = "https://openrouter.ai/api/v1";
            break;
        default:
            console.error("Provider not found");
            process.exit(1);
    }

    const apiKey = await password({message: "Input your API key", toggleMask: true});

    const response = await fetch(`${baseUrl}/models`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + apiKey
        },
        signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
        const models = await response.json() as ModelList;

        const model = await search({
            message: "Select an AI model",
            source: async (input, { signal }) => {
                if (!input) {
                    return [];
                }

                const matchingModels = models.data.filter(model => {
                    return model.id.toLowerCase().includes(input.toLowerCase().trim())
                    || model.name.toLowerCase().includes(input.toLowerCase().trim());
                })

                return matchingModels.map((model) => ({
                    name: model.name,
                    value: model.id,
                    description: model.description
                }));
            }
        })

        const apiSetup: ApiSetup = {baseUrl, apiKey, model}

        return [apiSetup, models];
    } else {
        if (response.status == 401) {
            return askProvider();
        }

        console.error(`Failed to get models from provider: ${response.status}`);
        process.exit(1);
    }
}