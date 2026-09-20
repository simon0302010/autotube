import type { ResponseInput } from "openai/resources/responses/responses.mjs";
import { truncateHistory } from "./truncateHistory";
import { truncateItems } from "./truncateItems";
import { truncateBoth } from "./truncateBoth";

export type CompactionStrategy = "summarize" | "truncate" | "truncateHistory" | "truncateItems"

export async function compact(
  history: ResponseInput,
  tokens: number,
  strategy: CompactionStrategy,
): Promise<{
  history: ResponseInput;
  tokens: number;
}> {
  switch (strategy) {
    case "summarize":
      throw new Error("Summarize not implemented yet");
    case "truncate":
      return truncateBoth(history, tokens);
    case "truncateHistory":
      return truncateHistory(history, tokens);
    case "truncateItems":
      return truncateItems(history, tokens);
  }
}
