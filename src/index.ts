#!/usr/bin/env bun

import OpenAI, { APIError } from "openai";
import { askProvider } from "./models";

const [apiSetup, models] = await askProvider();

console.log("User selected: ", apiSetup.model);

const client = new OpenAI({
    apiKey: apiSetup.apiKey,
    baseURL: apiSetup.baseUrl
});

try {
    const response = await client.responses.create({
        model: "google/gemini-3.1-flash-lite",
        instructions: "You are a helpful assistant.",
        input: "Please tell me why Rust is better than Java."
    });

    console.log(response.output_text);
} catch (error) {
    if (error instanceof APIError) {
        console.error(`API Error: ${error.message}`);
    } else {
        throw error
    }
}