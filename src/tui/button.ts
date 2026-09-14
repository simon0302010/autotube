import {
  BoxRenderable,
  CliRenderer,
  MouseEvent,
  Renderable,
  TextRenderable,
} from "@opentui/core";
import { changeColorBrightnessFactor, hexColor, type ColorRgb } from "../utils";

const DEFAULT_BACKGROUND_COLOR: ColorRgb = { r: 200, g: 0, b: 0 };
const DEFAULT_TEXT_COLOR: ColorRgb = { r: 0, g: 0, b: 0 };

interface TuiButtonOptions {
  id?: string;
  label: string;
  textColor?: ColorRgb;
  backgroundColor?: ColorRgb;
  width?: number | "auto" | `${number}%`; // Must be wider than the label
  height?: number | "auto" | `${number}%`; // Must be > 1
  margin?: number | "auto" | `${number}%`;
  onClick?: () => void;
}

export class TuiButton {
  private label: TextRenderable;
  private textColor: ColorRgb;
  private backgroundColor: ColorRgb;
  private onClick?: () => void;

  // Only the class should be able to edit these
  private _renderable: BoxRenderable;
  private _pressed: boolean;

  constructor(renderer: CliRenderer, options: TuiButtonOptions) {
    this.textColor = options.textColor ?? DEFAULT_TEXT_COLOR;
    this.backgroundColor = options.backgroundColor ?? DEFAULT_BACKGROUND_COLOR;
    this.onClick = options.onClick;
    this._pressed = false;

    // Enforcing the minimum width
    let width = options.width ?? options.label.length + 2;
    if (typeof width === "number") {
      width = Math.max(width, options.label.length);
    }

    // Enforcing the minimum height
    let height = options.height ?? 3;
    if (typeof height === "number") {
      height = Math.max(height, 1);
    }

    this._renderable = new BoxRenderable(renderer, {
      width,
      height,
      backgroundColor: hexColor(this.backgroundColor),
      alignItems: "center",
      justifyContent: "center",
      onMouseDown: (event: MouseEvent) => this.onDown(event),
      onMouseUp: (event: MouseEvent) => this.onUp(event),
      onMouseOut: (event: MouseEvent) => this.onUp(event),
      margin: options.margin,
      id: options.id,
    });

    this.label = new TextRenderable(renderer, {
      content: options.label,
      fg: hexColor(this.textColor),
      selectable: false,
    });

    this._renderable.add(this.label);
  }

  get renderable(): Renderable {
    return this._renderable;
  }

  get pressed(): boolean {
    return this._pressed;
  }

  private onDown(_event: MouseEvent) {
    this._renderable.backgroundColor = hexColor(
      changeColorBrightnessFactor(this.backgroundColor, 0.75),
    );
    this.label.fg = hexColor(changeColorBrightnessFactor(this.textColor, 0.75));

    if (!this.pressed && this.onClick) {
      this.onClick();
    }

    this._pressed = true;
  }

  private onUp(_event: MouseEvent) {
    this._renderable.backgroundColor = hexColor(this.backgroundColor);
    this.label.fg = hexColor(this.textColor);

    this._pressed = false;
  }
}
