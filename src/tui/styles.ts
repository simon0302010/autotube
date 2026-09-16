import { RGBA, SyntaxStyle } from "@opentui/core";

export const MARKDOWN_SYNTAX_STYLE = SyntaxStyle.fromStyles({
  "markup.heading": { fg: RGBA.fromHex("#58A6FF"), bold: true },
  "markup.heading.1": {
    fg: RGBA.fromHex("#00FF88"),
    bold: true,
    underline: true,
  },
  "markup.heading.2": { fg: RGBA.fromHex("#00D7FF"), bold: true },
  "markup.bold": { fg: RGBA.fromHex("#F0F6FC"), bold: true },
  "markup.strong": { fg: RGBA.fromHex("#F0F6FC"), bold: true },
  "markup.italic": { fg: RGBA.fromHex("#F0F6FC"), italic: true },
  "markup.list": { fg: RGBA.fromHex("#FF7B72") },
  "markup.quote": { fg: RGBA.fromHex("#8B949E"), italic: true },
  "markup.raw": { fg: RGBA.fromHex("#A5D6FF") },
  "markup.raw.block": { fg: RGBA.fromHex("#A5D6FF") },
  "markup.link": { fg: RGBA.fromHex("#58A6FF"), underline: true },
  "markup.link.url": { fg: RGBA.fromHex("#58A6FF"), underline: true },
  default: { fg: RGBA.fromHex("#E6EDF3") },
});
