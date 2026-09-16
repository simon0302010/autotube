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

export const MARKDOWN_SYNTAX_THOUGHT_STYLE = SyntaxStyle.fromStyles({
  "markup.heading": { fg: RGBA.fromHex("#386292"), bold: true },
  "markup.heading.1": {
    fg: RGBA.fromHex("#1b8f59"),
    bold: true,
    underline: true,
  },
  "markup.heading.2": { fg: RGBA.fromHex("#0f7688"), bold: true },
  "markup.bold": { fg: RGBA.fromHex("#767b80"), bold: true },
  "markup.strong": { fg: RGBA.fromHex("#757d85"), bold: true },
  "markup.italic": { fg: RGBA.fromHex("#64686c"), italic: true },
  "markup.list": { fg: RGBA.fromHex("#824e4b") },
  "markup.quote": { fg: RGBA.fromHex("#4e535a"), italic: true },
  "markup.raw": { fg: RGBA.fromHex("#537895") },
  "markup.raw.block": { fg: RGBA.fromHex("#557895") },
  "markup.link": { fg: RGBA.fromHex("#3d6ea6"), underline: true },
  "markup.link.url": { fg: RGBA.fromHex("#365b86"), underline: true },
  default: { fg: RGBA.fromHex("#6a6a6a") },
});
