import type { ResponseInput } from "openai/resources/responses/responses.mjs";
import { truncateHistory } from "./truncateHistory";
import { truncateItems } from "./truncateItems";

export function truncateBoth(
  history: ResponseInput,
  tokens: number,
): {
  history: ResponseInput;
  tokens: number;
} {
    const {history: newHistory, tokens: newTokens} = truncateItems(history, tokens)
    return truncateHistory(newHistory, newTokens)
}