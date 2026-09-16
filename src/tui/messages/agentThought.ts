import {
  CliRenderer,
  KeyEvent,
  MarkdownRenderable,
  RGBA,
  SyntaxStyle,
  TextRenderable,
  type Renderable,
  type StyleDefinition,
} from "@opentui/core";
import { hexColor, type ColorRgb } from "../../utils";
import { MARKDOWN_SYNTAX_STYLE } from "../styles";

const THOUGHT_PLACEHOLDER: string = "# Click to view thinking process";
const THOUGHT_PLACEHOLDER_COLOR: string = "#ff9d00";

interface AgentThoughtOptions {
  id?: string;
  content: string;
  textColor?: ColorRgb;
}

export class AgentThought {
  private _renderable: MarkdownRenderable;
  private _content: string;
  private expanded: boolean;
  private mouseDown: boolean;
  private firstHeadingColor: StyleDefinition; // Stores markup.heading.1 style

  constructor(renderer: CliRenderer, options: AgentThoughtOptions) {
    this._renderable = new MarkdownRenderable(renderer, {
      id: options.id,
      content: THOUGHT_PLACEHOLDER,
      width: "auto",
      marginBottom: 1,
      marginLeft: 2,
      marginRight: 2,
      syntaxStyle: MARKDOWN_SYNTAX_STYLE,
      onMouseDown: this.onMouseDown.bind(this),
      onMouseUp: this.onMouseUp.bind(this),
    });

    this.firstHeadingColor = this._renderable.syntaxStyle.getStyle(
      "markup.heading.1",
    ) ?? {
      fg: RGBA.fromHex("#00FF88"),
      bold: true,
      underline: true,
    };

    this._renderable.syntaxStyle.registerStyle("markup.heading.1", {
      fg: RGBA.fromHex(THOUGHT_PLACEHOLDER_COLOR),
      bold: true,
    });

    this._renderable.selectable = false;
    this.mouseDown = false;
    this.expanded = false;
    this._content = options.content;
  }

  onMouseDown() {
    if (!this.mouseDown) this.onClick();
    this.mouseDown = true;
  }

  onMouseUp() {
    this.mouseDown = false;
  }

  onClick() {
    console.error("clicked");

    if (this.expanded) {
      this._renderable.content = this.content;
      this._renderable.selectable = true;
      this._renderable.syntaxStyle.registerStyle(
        "markup.heading.1",
        this.firstHeadingColor,
      );
    } else {
      this._renderable.content = THOUGHT_PLACEHOLDER;
      this._renderable.selectable = false;
      this._renderable.syntaxStyle.registerStyle("markup.heading.1", {
        fg: RGBA.fromHex(THOUGHT_PLACEHOLDER_COLOR),
        bold: true,
      });
    }
    this.expanded = !this.expanded;
  }

  get renderable(): Renderable {
    return this._renderable;
  }

  get content(): string {
    return this._content;
  }
}
