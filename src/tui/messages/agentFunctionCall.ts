import { CliRenderer, TextRenderable, type Renderable } from "@opentui/core";
import { type ColorRgb } from "../../utils";

interface AgentFunctionCallOptions {
  id?: string;
  functionName: string;
  functionArguments: Record<string, unknown>;
  callId?: string;
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

  formatFunctionCall(
    name: string,
    args: Record<string, unknown>,
  ): [string, string] {
    const topLevelValues = [];
    for (const key of Object.keys(args)) {
      topLevelValues.push(`${key} = ${JSON.stringify(args[key])}`);
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
