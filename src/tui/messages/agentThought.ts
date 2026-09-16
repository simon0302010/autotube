import {
  BoxRenderable,
  CliRenderer,
  MarkdownRenderable,
  type Renderable,
} from "@opentui/core";
import { type ColorRgb } from "../../utils";
import { MARKDOWN_SYNTAX_THOUGHT_STYLE } from "../styles";
import { TuiButton } from "../button";

const DEFAULT_STREAM: boolean = false;

interface AgentThoughtOptions {
  id?: string;
  content?: string;
  textColor?: ColorRgb;
  stream?: boolean;
}

export class AgentThought {
  private _renderable: BoxRenderable;
  private thoughtText: MarkdownRenderable;
  private expandButton: TuiButton;
  private expanded: boolean;

  constructor(renderer: CliRenderer, options: AgentThoughtOptions) {
    this._renderable = new BoxRenderable(renderer, {
      id: options.id,
      width: "auto",
      marginBottom: 1,
      marginLeft: 2,
      marginRight: 2,
    });

    this.expandButton = new TuiButton(renderer, {
      label: "Show thinking process",
      height: -1, // Smallest possible
      width: -1, // Smallest possible
      textColor: { r: 255, g: 165, b: 0 },
      backgroundColor: { r: 50, g: 50, b: 50 },
      onClick: this.onButtonClick.bind(this),
    });

    this.thoughtText = new MarkdownRenderable(renderer, {
      content: options.content ?? "",
      width: "100%",
      syntaxStyle: MARKDOWN_SYNTAX_THOUGHT_STYLE,
      marginTop: 1,
      visible: false,
      streaming: options.stream ?? DEFAULT_STREAM,
    });

    this._renderable.add(this.expandButton.renderable);
    this._renderable.add(this.thoughtText);

    this.expanded = false;
  }

  async onButtonClick() {
    this.expanded = !this.expanded;
    this.thoughtText.visible = this.expanded;
    if (this.expanded) this.expandButton.label = "Hide thinking process";
    else this.expandButton.label = "Show thinking process";
  }

  async addChunk(chunk: string) {
    if (this.thoughtText.streaming) this.thoughtText.content += chunk;
  }

  async finishStream() {
    this.thoughtText.streaming = false;
  }

  get renderable(): Renderable {
    return this._renderable;
  }

  get content(): string {
    return this.thoughtText.content;
  }
}
