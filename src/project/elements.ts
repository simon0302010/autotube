import type { ElementAnimations } from "./animations";

export interface Element {
  type: string;
  animations?: ElementAnimations;
}

export interface ImageElement extends Element {
  type: "image";
  path: string;
}
