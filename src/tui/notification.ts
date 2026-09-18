import {
  BoxRenderable,
  TextRenderable,
  type BorderStyle,
  type CliRenderer,
} from "@opentui/core";
import { sleep } from "bun";

interface TuiNotificationOptions {
  content: string;
  backgroundColor?: string;
  textColor?: string;
  borderStyle?: BorderStyle;
}

export class TuiNotification {
  private renderer: CliRenderer;
  private box: BoxRenderable;

  constructor(renderer: CliRenderer, options: TuiNotificationOptions) {
    const backgroundColor = options.backgroundColor ?? "#272727";
    const textColor = options.textColor ?? "#c9c9c9";

    this.box = new BoxRenderable(renderer, {
      border: true,
      borderStyle: options.borderStyle,
      width: "auto",
      height: "auto",
      position: "absolute",
      top: 1,
      right: 3,
      zIndex: Infinity,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor,
    });

    const text = new TextRenderable(renderer, {
      content: ` ${options.content} `,
      fg: textColor,
      bg: backgroundColor,
    });

    this.box.add(text);

    this.renderer = renderer;
  }

  async display(duration: number) {
    this.renderer.root.add(this.box);
    await sleep(duration);
    this.box.destroyRecursively();
  }
}
