import convert from "color-convert";
import { lerp } from "./utils";

type A = { a: number };

// h: 0–360, s: 0–100, v: 0–100, a: 0-1
export type HSV = { h: number; s: number; v: number };
export type HSVA = HSV & A;
export type RGB = { r: number; g: number; b: number };
export type RGBA = RGB & A;
export type Oklab = { l: number; a: number; b: number };

export function hsv2css(hsv: HSV): string {
  const [r, g, b] = convert.hsv.rgb(hsv.h, hsv.s, hsv.v);

  return `rgb(${r}, ${g}, ${b})`;
}

export function rgb2hsv(r: number, g: number, b: number): HSV {
  const [h, s, v] = convert.rgb.hsv(r, g, b);

  return { h, s, v };
}

export function rgb2oklab(rgb: RGB): Oklab {
  // @ts-ignore
  const [l, a, b] = convert.rgb.oklab(rgb.r, rgb.g, rgb.b);

  return { l, a, b };
}

export function hashRgb({ r, g, b }: RGB): number {
  return (r << 16) | (g << 8) | b;
}

export function oklabDistance(c1: Oklab, c2: Oklab): number {
  const dl = c1.l - c2.l;
  const da = c1.a - c2.a;
  const db = c1.b - c2.b;

  return Math.sqrt(dl * dl + da * da + db * db);
}

export function interpolator(space: "oklab" | "lab", a: HSV, b: HSV) {
  // @ts-ignore
  const _a: number[] = convert.hsv[space](a.h, a.s, a.v);
  // @ts-ignore
  const _b: number[] = convert.hsv[space](b.h, b.s, b.v);

  return (t: number): HSV => {
    const x = _a.map((_, i) => lerp(_a[i], _b[i], t));
    // @ts-ignore
    const [h, s, v] = convert[space].hsv(x);

    return { h, s, v };
  };
}

export function closestColor(target: Oklab, colors: Oklab[]): RGB {
  let minDistance = Infinity;
  let closest = colors[0];

  for (let i = 0; i < colors.length; i++) {
    const distance = oklabDistance(target, colors[i]);

    if (distance < minDistance) {
      minDistance = distance;
      closest = colors[i];
    }
  }

  // @ts-ignore
  const [r, g, b] = convert.oklab.rgb(closest.l, closest.a, closest.b);

  return { r, g, b };
}

export function imageData2rgba(imageData: ImageData): RGBA[] {
  const { data } = imageData;
  const rgbaData: RGBA[] = [];

  for (let i = 0; i < data.length; i += 4) {
    rgbaData.push({
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
      a: data[i + 3],
    });
  }

  return rgbaData;
}
