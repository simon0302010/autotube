import OpenAI, { APIError } from "openai";
import type { ApiSetup } from "./models";
import type { Response } from "openai/resources/responses/responses.js";

export async function completionRequest(apiSetup: ApiSetup, prompt: string): Promise<Response | undefined> {
    const client = new OpenAI({
        apiKey: apiSetup.apiKey,
        baseURL: apiSetup.baseUrl
    });

    try {
        const response = await client.responses.create({
            model: apiSetup.model,
            input: prompt
        });

        return response
    } catch (error) {
        if (error instanceof APIError) {
            console.error(`API Error: ${error.message}`);
            return undefined;
        } else {
            throw error
        }
    }
}