export interface ColorRgb {
  r: number;
  g: number;
  b: number;
}

function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), max);
}

export function hexColor(color: [number, number, number] | ColorRgb): string {
  let r: number;
  let g: number;
  let b: number;

  if (Array.isArray(color)) {
    [r, g, b] = color;
  } else {
    r = color.r;
    g = color.g;
    b = color.b;
  }

  r = clamp(Math.round(r), 0, 255);
  g = clamp(Math.round(g), 0, 255);
  b = clamp(Math.round(b), 0, 255);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function darkenColor(color: ColorRgb, amount: number): ColorRgb {
  const r = clamp(color.r - amount, 0, 255);
  const g = clamp(color.g - amount, 0, 255);
  const b = clamp(color.b - amount, 0, 255);

  return { r, g, b };
}
