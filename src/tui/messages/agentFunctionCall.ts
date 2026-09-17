import {
  BoxRenderable,
  CliRenderer,
  MarkdownRenderable,
  TextRenderable,
  type Renderable,
} from "@opentui/core";
import { type ColorRgb } from "../../utils";
import { MARKDOWN_SYNTAX_THOUGHT_STYLE } from "../styles";
import { TuiButton } from "../button";

interface AgentFunctionCallOptions {
  id?: string;
  functionName: string;
  functionArguments: string;
  callId: string;
  textColor?: ColorRgb;
}

export class AgentFunctionCall {
  private _renderable: TextRenderable;

  constructor(renderer: CliRenderer, options: AgentFunctionCallOptions) {
    const [text, color] = this.formatFunctionCall(
      options.functionName,
      options.functionArguments,
    );

    this._renderable = new TextRenderable(renderer, {
      id: options.id,
      content: text,
      width: "auto",
      marginBottom: 1,
      marginLeft: 2,
      marginRight: 2,
      fg: color,
    });
  }

  formatFunctionCall(name: string, args: string): [string, string] {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(args);
    } catch {
      return [name, "#de1d1d"];
    }

    const topLevelValues = [];
    for (const key of Object.keys(parsed)) {
      topLevelValues.push(`${key} = ${JSON.stringify(parsed[key])}`);
    }
    return [`${name}(${topLevelValues.join(", ")})`, "#7b7b7b"];
  }

  get renderable(): Renderable {
    return this._renderable;
  }

  get content(): string {
    return this._renderable.plainText;
  }

  // To make it low profile
  set marginBottom(value: number) {
    this._renderable.marginBottom = value;
  }
}
