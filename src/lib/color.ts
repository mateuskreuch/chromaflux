import convert from "color-convert";
import { lerp } from "./utils";

// h: 0–360, s: 0–100, v: 0–100, a: 0-1
export type HSV = { h: number; s: number; v: number };
export type HSVA = HSV & { a: number };
export type RGB = { r: number; g: number; b: number };

export function rgbString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function hsv2rgb(hsv: HSV): RGB {
  const [r, g, b] = convert.hsv.rgb(hsv.h, hsv.s, hsv.v);

  return { r, g, b };
}

export function rgb2hsv(r: number, g: number, b: number): HSV {
  const [h, s, v] = convert.rgb.hsv(r, g, b);

  return { h, s, v };
}

export function interpolator(space: "oklab" | "lab", a: HSV, b: HSV) {
  const _a: number[] = convert.hsv[space](a.h, a.s, a.v);
  const _b: number[] = convert.hsv[space](b.h, b.s, b.v);

  return (t: number): RGB => {
    const x = _a.map((_, i) => lerp(_a[i], _b[i], t));
    const [r, g, b] = convert[space].rgb(x);

    return { r, g, b };
  };
}
