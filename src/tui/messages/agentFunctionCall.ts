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

interface AgentFunctionCallOptions {
  id?: string;
  functionName: string;
  functionArguments: string;
  callId: string;
  textColor?: ColorRgb;
  stream?: boolean;
}

export class AgentFunctionCall {
  private _renderable: BoxRenderable;
  private expandButton: TuiButton;
  private expanded: boolean;
  private functionDetails: MarkdownRenderable;

  constructor(renderer: CliRenderer, options: AgentFunctionCallOptions) {
    this._renderable = new BoxRenderable(renderer, {
      id: options.id,
      width: "auto",
      marginBottom: 1,
      marginLeft: 2,
      marginRight: 2,
    });

    this.expandButton = new TuiButton(renderer, {
      label: `Called \`${options.functionName}\``,
      height: -1, // Smallest possible
      width: -1, // Smallest possible
      textColor: { r: 255, g: 165, b: 0 },
      backgroundColor: { r: 50, g: 50, b: 50 },
      onClick: this.onButtonClick.bind(this),
    });

    // TODO: Replace this without using markdown
    this.functionDetails = new MarkdownRenderable(renderer, {
      content: `**Function \`${options.functionName}\`** [\`${options.callId}\`]\n\n**Arguments**\n\n\`${options.functionArguments}\``,
      width: "100%",
      syntaxStyle: MARKDOWN_SYNTAX_THOUGHT_STYLE, // TODO: Create a style for function calls
      marginTop: 1,
      visible: false,
      streaming: options.stream ?? DEFAULT_STREAM,
    });

    this._renderable.add(this.expandButton.renderable);
    this._renderable.add(this.functionDetails);

    this.expanded = false;
  }

  async onButtonClick() {
    this.expanded = !this.expanded;
    this.functionDetails.visible = this.expanded;
    if (this.expanded) this.expandButton.label = "Hide thinking process";
    else this.expandButton.label = "Show thinking process";
  }

  async addChunk(chunk: string) {
    if (this.functionDetails.streaming) this.functionDetails.content += chunk;
  }

  async finishStream() {
    this.functionDetails.streaming = false;
  }

  get renderable(): Renderable {
    return this._renderable;
  }

  get content(): string {
    return this.functionDetails.content;
  }
}
