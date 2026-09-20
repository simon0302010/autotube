import type { ResponseInputItem } from "openai/resources/responses/responses.mjs";

export const IMAGE_CHAR_EQUIVALENT = 1200; /** Approximate token use of an image, converted to characters */

export const MESSAGE_FRAMING_CHARS = 16; /** Approximate token use of message framing in the prompt, in characters */

export function getResponseItemCharWeight(item: ResponseInputItem): number {
  let chars = MESSAGE_FRAMING_CHARS;

  if ("role" in item) chars += item.role.length;
  if ("content" in item) {
    if (typeof item.content === "string") {
      chars += item.content.length;
    } else if (Array.isArray(item.content)) {
      for (const part of item.content) {
        if ("text" in part) {
          chars += part.text.length;
        } else if (part.type === "input_image") {
          chars += IMAGE_CHAR_EQUIVALENT;
        } // TODO: Handle "input_file"
      }
    }
  }

  if ("name" in item) chars += item.name!.length;
  if ("arguments" in item) {
    if (typeof item.arguments === "string") chars += item.arguments.length;
    else {
      chars += JSON.stringify(item.arguments).length;
    }
  }
  if ("output" in item && typeof item.output === "string")
    chars += item.output!.length;

  return chars;
}

export function calculateItemTokens(
  items: ResponseInputItem[],
  tokens: number,
): number[] {
  const weights = items.map<number>((item) => getResponseItemCharWeight(item));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const allocations = weights.map<{
    tokens: number;
    remainder: number;
  }>((weight) => {
    const exactTokens = (weight / totalWeight) * tokens;
    const allocation = Math.floor(exactTokens);
    const remainder = exactTokens - allocation;

    return {
      tokens: allocation,
      remainder,
    };
  });

  const remainingTokens =
    tokens - allocations.reduce((sum, a) => sum + a.tokens, 0);

  const remainderIndices = allocations
    .map((a, index) => {
      return {
        index,
        remainder: a.remainder,
      };
    })
    .sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; i < remainingTokens; i++) {
    allocations[remainderIndices[i]!.index]!.tokens += 1;
  }

  return allocations.map((a) => a.tokens);
}
