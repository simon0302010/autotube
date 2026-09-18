import {
  BoxRenderable,
  CliRenderer,
  MouseEvent,
  Renderable,
  TextRenderable,
} from "@opentui/core";
import { changeColorBrightnessFactor, hexColor, type ColorRgb } from "../utils";

const DEFAULT_TEXT_COLOR: ColorRgb = { r: 0, g: 0, b: 0 };

interface TuiButtonOptions {
  id?: string;
  label: string;
  textColor?: ColorRgb;
  backgroundColor?: ColorRgb;
  width?: number | "auto" | `${number}%`; // Must be wider than the label
  height?: number | "auto" | `${number}%`; // Must be > 1
  margin?: number | "auto" | `${number}%`;
  marginTop?: number | "auto" | `${number}%`;
  marginBottom?: number | "auto" | `${number}%`;
  marginLeft?: number | "auto" | `${number}%`;
  marginRight?: number | "auto" | `${number}%`;
  onClick?: () => void;
}

export class TuiButton {
  private _label: TextRenderable;
  private textColor: ColorRgb;
  private backgroundColor?: ColorRgb;
  private onClick?: () => void;

  // Only the class should be able to edit these
  private _renderable: BoxRenderable;
  private _pressed: boolean;

  constructor(renderer: CliRenderer, options: TuiButtonOptions) {
    this.textColor = options.textColor ?? DEFAULT_TEXT_COLOR;
    this.backgroundColor = options.backgroundColor;
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
      backgroundColor: this.backgroundColor
        ? hexColor(this.backgroundColor)
        : undefined,
      alignItems: "center",
      justifyContent: "center",
      onMouseDown: (event: MouseEvent) => this.onDown(event),
      onMouseUp: (event: MouseEvent) => this.onUp(event),
      onMouseOut: (event: MouseEvent) => this.onUp(event),
      margin: options.margin,
      marginTop: options.marginTop,
      marginRight: options.marginRight,
      marginBottom: options.marginBottom,
      marginLeft: options.marginLeft,
      id: options.id,
    });

    this._label = new TextRenderable(renderer, {
      content: options.label,
      fg: hexColor(this.textColor),
      selectable: false,
    });

    this._renderable.add(this._label);
  }

  get renderable(): Renderable {
    return this._renderable;
  }

  get pressed(): boolean {
    return this._pressed;
  }

  set label(value: string) {
    this._label.content = value;
  }

  get label(): string {
    return this._label.plainText;
  }

  private onDown(_event: MouseEvent) {
    if (this.backgroundColor)
      this._renderable.backgroundColor = hexColor(
        changeColorBrightnessFactor(this.backgroundColor, 0.75),
      );
    this._label.fg = hexColor(
      changeColorBrightnessFactor(this.textColor, 0.75),
    );

    if (!this.pressed && this.onClick) {
      this.onClick();
    }

    this._pressed = true;
  }

  private onUp(_event: MouseEvent) {
    if (this.backgroundColor)
      this._renderable.backgroundColor = hexColor(this.backgroundColor);
    this._label.fg = hexColor(this.textColor);

    this._pressed = false;
  }
}
