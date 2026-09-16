import { CliRenderer, TextRenderable, type Renderable } from "@opentui/core";
import { hexColor, type ColorRgb } from "../../utils";

const DEFAULT_TEXT_COLOR: ColorRgb = { r: 150, g: 150, b: 150 };

interface AgentThoughtOptions {
  id?: string;
  content: string;
  textColor?: ColorRgb;
}

export class AgentThought {
  private _renderable: TextRenderable;

  constructor(renderer: CliRenderer, options: AgentThoughtOptions) {
    this._renderable = new TextRenderable(renderer, {
      id: options.id,
      content: options.content,
      width: "auto",
      fg: hexColor(options.textColor ?? DEFAULT_TEXT_COLOR),
      marginBottom: 1,
      marginLeft: 2,
      marginRight: 2,
    });
  }

  get renderable(): Renderable {
    return this._renderable;
  }

  get content(): string {
    return this._renderable.plainText;
  }
}
