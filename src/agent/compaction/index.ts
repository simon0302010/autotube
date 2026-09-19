import type { ResponseInput } from "openai/resources/responses/responses.mjs";
import { truncateHistory } from "./truncate";

export async function compact(
  history: ResponseInput,
  tokens: number,
  strategy: "summarize" | "truncate",
): Promise<{
  history: ResponseInput;
  tokens: number;
}> {
  switch (strategy) {
    case "summarize":
      throw new Error("Summarize not implemented yet");
    case "truncate":
      return truncateHistory(history, tokens);
  }
}
