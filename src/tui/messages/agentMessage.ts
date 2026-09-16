import {
  CliRenderer,
  MarkdownRenderable,
  type Renderable,
} from "@opentui/core";
import { type ColorRgb } from "../../utils";
import { MARKDOWN_SYNTAX_STYLE } from "../styles";

interface AgentMessageOptions {
  id?: string;
  content: string;
  textColor?: ColorRgb;
}

export class AgentMessage {
  private _renderable: MarkdownRenderable;

  constructor(renderer: CliRenderer, options: AgentMessageOptions) {
    this._renderable = new MarkdownRenderable(renderer, {
      id: options.id,
      content: options.content,
      width: "auto",
      marginBottom: 1,
      marginLeft: 2,
      marginRight: 2,
      syntaxStyle: MARKDOWN_SYNTAX_STYLE,
    });
  }

  get renderable(): Renderable {
    return this._renderable;
  }

  get content(): string {
    return this._renderable.content;
  }
}
