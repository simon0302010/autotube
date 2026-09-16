import {
  BoxRenderable,
  CliRenderer,
  TextRenderable,
  type Renderable,
} from "@opentui/core";
import { hexColor, type ColorRgb } from "../../utils";
import { formatTime } from "../../utils/time";
import { DEFAULT_USE_24_HOUR_TIME } from "../../config";

const DEFAULT_BACKGROUND_COLOR: ColorRgb = { r: 30, g: 30, b: 30 };
const DEFAULT_TEXT_COLOR: ColorRgb = { r: 200, g: 200, b: 200 };
const DEFAULT_TIME_TEXT_COLOR: ColorRgb = { r: 80, g: 80, b: 80 };

interface UserMessageOptions {
  id?: string;
  content: string;
  sentAt?: Date;
  textColor?: ColorRgb;
  timeTextColor?: ColorRgb;
  backgroundColor?: ColorRgb;
  use24HourTime?: boolean;
}

export class UserMessage {
  private _content: TextRenderable;
  private _renderable: Renderable;
  readonly sentAt: Date;

  constructor(renderer: CliRenderer, options: UserMessageOptions) {
    this.sentAt = options.sentAt ?? new Date();

    this._renderable = new BoxRenderable(renderer, {
      id: options.id,
      width: "100%",
      height: "auto",
      padding: 1,
      marginBottom: 1,
      backgroundColor: hexColor(
        options.backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
      ),
    });

    this._content = new TextRenderable(renderer, {
      content: options.content,
      width: "100%",
      fg: hexColor(options.textColor ?? DEFAULT_TEXT_COLOR),
    });

    const timeText = new TextRenderable(renderer, {
      content: formatTime(
        this.sentAt,
        options.use24HourTime ?? DEFAULT_USE_24_HOUR_TIME,
      ),
      fg: hexColor(options.timeTextColor ?? DEFAULT_TIME_TEXT_COLOR),
    });

    this._renderable.add(this._content);
    this._renderable.add(timeText);
  }

  get renderable(): Renderable {
    return this._renderable;
  }

  get content(): string {
    return this._content.plainText;
  }
}
