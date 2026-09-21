import {
  CliRenderer,
  MarkdownRenderable,
  type Renderable,
} from "@opentui/core";
import { type ColorRgb } from "../../utils";
import { MARKDOWN_SYNTAX_STYLE } from "../styles";

const DEFAULT_STREAM: boolean = false;

interface AgentMessageOptions {
  id?: string;
  content?: string;
  textColor?: ColorRgb;
  stream?: boolean;
}

export class AgentMessage {
  private _renderable: MarkdownRenderable;

  constructor(renderer: CliRenderer, options: AgentMessageOptions) {
    this._renderable = new MarkdownRenderable(renderer, {
      id: options.id,
      content: options.content ?? "",
      width: "auto",
      marginBottom: 1,
      marginLeft: 2,
      marginRight: 2,
      syntaxStyle: MARKDOWN_SYNTAX_STYLE,
      streaming: options.stream ?? DEFAULT_STREAM,
    });
  }

  async addChunk(chunk: string) {
    if (this._renderable.streaming) this._renderable.content += chunk;
    this._renderable.content = this._renderable.content.replace("<br>", "\n");
  }

  async finishStream() {
    this._renderable.streaming = false;
  }

  get renderable(): Renderable {
    return this._renderable;
  }

  get content(): string {
    return this._renderable.content;
  }
}
