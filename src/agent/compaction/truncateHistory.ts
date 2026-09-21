import type { ResponseInput } from "openai/resources/responses/responses.mjs";
import { calculateItemTokens } from "./tokenizeItems";

const PHI_INV = (Math.sqrt(5) - 1) / 2;

/**
 * Truncates the history to reduce tokens
 * @param history The existing history
 * @param tokens The current estimated token use
 * @returns The truncated history and estimated new token use
 * @remarks
 * Admittedly, I chose to use the golden ratio here for fun. I couldn't find any documented use of the golden ratio for token truncation online, but after consulting with an LLM, it will actually work quite well.
 */
export function truncateHistory(
  history: ResponseInput,
  tokens: number,
): {
  history: ResponseInput;
  tokens: number;
} {
  const targetNewTokens = Math.round(tokens * PHI_INV);
  const removeCount = tokens - targetNewTokens;
  const skipCount = targetNewTokens - removeCount;

  const newHistory: ResponseInput = [];

  const tokenAllocations = calculateItemTokens(history, tokens);

  // Include prefix items up to skipCount, remove middle items up to removeCount, then keep remainder
  let keptPrefixTokens = 0;
  let removedTokens = 0;

  for (const [index, item] of history.entries()) {
    const itemAllocation = tokenAllocations[index]!;
    if (keptPrefixTokens < skipCount && removedTokens === 0) {
      newHistory.push(item);
      keptPrefixTokens += itemAllocation;
    } else if (removedTokens < removeCount) {
      removedTokens += itemAllocation;
    } else {
      newHistory.push(item);
    }
  }

  // Ensure function_call and function_call_output pairs remain consistent
  const callIds = new Set<string>();
  const outputIds = new Set<string>();
  for (const item of newHistory) {
    if ("type" in item && item.type === "function_call") {
      const id = item.call_id || item.id;
      if (id) callIds.add(id);
    } else if ("type" in item && item.type === "function_call_output") {
      const id = item.call_id;
      if (id) outputIds.add(id);
    }
  }

  const finalHistory = newHistory.filter((item) => {
    if ("type" in item && item.type === "function_call") {
      const id = item.call_id || item.id;
      return id ? outputIds.has(id) : true;
    }
    if ("type" in item && item.type === "function_call_output") {
      const id = item.call_id;
      return id ? callIds.has(id) : true;
    }
    return true;
  });

  let actualRemainingTokens = 0;
  for (const [index, item] of history.entries()) {
    if (finalHistory.includes(item)) {
      actualRemainingTokens += tokenAllocations[index]!;
    }
  }

  return {
    history: finalHistory,
    tokens: actualRemainingTokens,
  };
}
