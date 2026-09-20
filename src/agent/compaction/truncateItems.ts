import type { ResponseInput } from "openai/resources/responses/responses.mjs";
import { calculateItemTokens, IMAGE_CHAR_EQUIVALENT } from "./tokenizeItems";

// TODO: This file has horrible naming. Add comments and rename things.
// TODO: There should probably be some tests for this.

const PHI_INV = (Math.sqrt(5) - 1) / 2;

/**
 * Truncates the largest contents of the history to reduce tokens
 * @param history The existing history
 * @param tokens The current estimated token use
 * @returns The truncated history and estimated new token use
 * @remarks
 * Admittedly, I chose to use the golden ratio here for fun. I couldn't find any documented use of the golden ratio for token truncation online, but after consulting with an LLM, it will actually work quite well.
 */
export function truncateItems(
  history: ResponseInput,
  tokens: number,
): {
  history: ResponseInput;
  tokens: number;
} {
  const tokenAllocations = calculateItemTokens(history, tokens);

  const meanTokens =
    tokenAllocations.reduce((a, b) => a + b, 0) / tokenAllocations.length;
  const largeContentThreshold = meanTokens / PHI_INV;

  let newTokens = 0;
  for (const [index, item] of history.entries()) {
    let itemTokens = tokenAllocations[index]!;
    if (itemTokens > largeContentThreshold) {
      // This content should be reduced if we can locate a text field worth reducing.

      if ("content" in item) {
        if (typeof item.content === "string") {
          // Apply the rule directly
          const targetItemTokens = Math.round(itemTokens * PHI_INV);
          const removeCount = itemTokens - targetItemTokens;
          const skipCount = targetItemTokens - removeCount;

          const skipChars = Math.floor((skipCount / itemTokens) * item.content.length);
          const removeChars = Math.floor((removeCount / itemTokens) * item.content.length);

          item.content =
            item.content.substring(0, skipChars) +
            "[...]" +
            item.content.substring(skipChars + removeChars);
          itemTokens = targetItemTokens;
        } else if (Array.isArray(item.content)) {
          const partChars = [];

          for (const part of item.content) {
            if ("text" in part) {
              partChars.push(part.text.length);
            } else if (part.type === "input_image") {
              partChars.push(IMAGE_CHAR_EQUIVALENT);
            } else {
              // TODO: Handle "input_file"
              partChars.push(0);
            }
          }

          const totalPartChars = partChars.reduce((a, b) => a + b, 0);

          const partTokens = partChars.map(
            (chars) => (chars / totalPartChars) * itemTokens,
          );

          const targetPartTokens = Math.round(itemTokens * PHI_INV);
          const removeCount = itemTokens - targetPartTokens;
          const skipCount = targetPartTokens - removeCount;

          const newParts = [];

          let newPartTokens = 0;
          let finalPartTokens = 0;

          for (const [partIndex, part] of item.content.entries()) {
            const partToken = partTokens[partIndex]!;
            if (newPartTokens < skipCount) {
              if (newPartTokens + partToken <= skipCount) {
                newParts.push(part);
                finalPartTokens += partToken;
              } else {
                // This part is too big to be added directly. Manually truncate it.
                if ("text" in part) {
                  const space = skipCount - newPartTokens;
                  const keep = space / partToken;
                  const keepChars = Math.floor(keep * part.text.length);
                  part.text = part.text.substring(0, keepChars) + "[...]";
                  newParts.push(part);
                  finalPartTokens += Math.floor(keep * partToken);
                } else {
                  // This is not a textual part. Just add it anyway.
                  newParts.push(part);
                  finalPartTokens += partToken;
                }
              }
            } else if (newPartTokens + partToken > skipCount + removeCount) {
              // This part is too big to be added directly. Manually truncate it (from the end)
              if ("text" in part) {
                const space = (newPartTokens + partToken) - (skipCount + removeCount);
                const keep = space / partToken;
                const keepChars = Math.floor(keep * part.text.length);
                part.text =
                  "[...]" +
                  part.text.substring(part.text.length - keepChars);
                newParts.push(part);
                finalPartTokens += Math.floor(keep * partToken);
              } else {
                // This is not a textual part. Just add it anyway.
                newParts.push(part);
                finalPartTokens += partToken;
              }
            }
            newPartTokens += partToken;
          }

          itemTokens -= newPartTokens - finalPartTokens;
          // TODO: Fix typing here
          item.content = newParts as any;
        }
      } else if ("output" in item && typeof item.output === "string") {
        const targetItemTokens = Math.round(itemTokens * PHI_INV);
        const removeCount = itemTokens - targetItemTokens;
        const skipCount = targetItemTokens - removeCount;

        const skipChars = Math.floor((skipCount / itemTokens) * item.output.length);
        const removeChars = Math.floor((removeCount / itemTokens) * item.output.length);

        item.output =
          item.output.substring(0, skipChars) +
          "[...]" +
          item.output.substring(skipChars + removeChars);
        itemTokens = targetItemTokens;
      }
      history[index] = item;
    }
    newTokens += itemTokens;
  }

  return {
    history,
    tokens: newTokens,
  };
}
