import {
  BoxRenderable,
  CliRenderer,
  MouseEvent,
  TextRenderable,
} from "@opentui/core";
import { darkenColor, hexColor, type ColorRgb } from "../utils";

const DEFAULT_TEXT_COLOR: ColorRgb = { r: 200, g: 0, b: 0 };
const DEFAULT_BACKGROUND_COLOR: ColorRgb = { r: 0, g: 0, b: 0 };

interface TuiButtonOptions {
  label: string;
  textColor?: ColorRgb;
  backgroundColor?: ColorRgb;
}

export class TuiButton {
  private label: TextRenderable;
  private textColor: ColorRgb;
  private backgroundColor: ColorRgb;
  box: BoxRenderable;

  pressed: boolean;

  constructor(renderer: CliRenderer, options: TuiButtonOptions) {
    this.textColor = options.textColor ?? DEFAULT_TEXT_COLOR;
    this.backgroundColor = options.backgroundColor ?? DEFAULT_BACKGROUND_COLOR;
    this.pressed = false;

    this.box = new BoxRenderable(renderer, {
      width: options.label.length + 2,
      height: 3,
      backgroundColor: hexColor(this.backgroundColor),
      alignItems: "center",
      justifyContent: "center",
      onMouseDown: (event: MouseEvent) => this.onDown(event),
      onMouseUp: (event: MouseEvent) => this.onUp(event),
      onMouseOut: (event: MouseEvent) => this.onUp(event),
    });

    this.label = new TextRenderable(renderer, {
      content: options.label,
      fg: hexColor(this.textColor),
      selectable: false,
    });

    this.box.add(this.label);
  }

  private onDown(event: MouseEvent) {
    this.box.backgroundColor = hexColor(darkenColor(this.backgroundColor, 10));
    this.pressed = true;
  }

  private onUp(event: MouseEvent) {
    this.box.backgroundColor = hexColor(this.backgroundColor);
    this.pressed = false;
  }
}
