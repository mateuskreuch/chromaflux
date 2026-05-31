import { rgb2hsv, type HSVA } from "./color";
import { clamp } from "./utils";

export type Point = { x: number; y: number };

export function getMousePos(e: MouseEvent, canvas: HTMLCanvasElement): Point {
  const w = canvas.width;
  const h = canvas.height;
  const rect = canvas.getBoundingClientRect();

  const x = Math.floor(((e.clientX - rect.left) * w) / rect.width);
  const y = Math.floor(((e.clientY - rect.top) * h) / rect.height);

  return {
    x: clamp(x, 0, w - 1),
    y: clamp(y, 0, h - 1),
  };
}

export function getHSVA(ctx: CanvasRenderingContext2D, { x, y }: Point): HSVA {
  const { data } = ctx.getImageData(x, y, 1, 1);
  const hsv = rgb2hsv(data[0], data[1], data[2]);

  return { ...hsv, a: data[3] };
}
