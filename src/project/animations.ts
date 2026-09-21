export interface SlideAnimation {
  type: "slide";
  direction: "up" | "down" | "left" | "right";
  slideSpeed: number;
}

export interface FadeAnimation {
  type: "fade";
  fadeSpeed: number;
}

export interface FloatAnimation {
  type: "float";
  floatSpeed: number;
  floatDistance: number;
  floatAxis: "x" | "y" | "xy";
}

export type EntryAnimation = SlideAnimation | FadeAnimation;
export type ExitAnimation = SlideAnimation | FadeAnimation;
export type LoopAnimation = FloatAnimation;

export interface ElementAnimations {
  entry?: EntryAnimation;
  exit?: ExitAnimation;
  loop?: LoopAnimation;
}
