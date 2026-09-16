import {
  CliRenderer,
  MarkdownRenderable,
  RGBA,
  SyntaxStyle,
  TextRenderable,
  type Renderable,
} from "@opentui/core";
import { hexColor, type ColorRgb } from "../../utils";

interface AgentMessageOptions {
  id?: string;
  content: string;
  textColor?: ColorRgb;
}

export class AgentMessage {
  private _renderable: MarkdownRenderable;

  constructor(renderer: CliRenderer, options: AgentMessageOptions) {
    const syntaxStyle = SyntaxStyle.fromStyles({
      "markup.heading.1": { fg: RGBA.fromHex("#58A6FF"), bold: true },
      "markup.list": { fg: RGBA.fromHex("#FF7B72") },
      "markup.raw": { fg: RGBA.fromHex("#A5D6FF") },
      default: { fg: RGBA.fromHex("#E6EDF3") },
    });

    this._renderable = new MarkdownRenderable(renderer, {
      id: options.id,
      content: options.content,
      width: "auto",
      marginBottom: 1,
      marginLeft: 2,
      marginRight: 2,
      syntaxStyle,
    });
  }

  get renderable(): Renderable {
    return this._renderable;
  }

  get content(): string {
    return this._renderable.content;
  }
}
