import { hsv2rgb, interpolator, rgbString, type HSV } from "@/lib/color";
import { Canvas, type Point } from "@/lib/canvas";

export class PixelCanvas extends Canvas {
  static override build(canvas: HTMLCanvasElement | undefined): PixelCanvas | null {
    return super.build(canvas, {
      willReadFrequently: true,
    }) as PixelCanvas | null;
  }

  drawPixel(pos: Point, color: HSV): void {
    this.ctx.fillStyle = rgbString(hsv2rgb(color));
    this.ctx.fillRect(pos.x, pos.y, 1, 1);
    this.propagate(pos, { x: 1, y: 0 }, 0, color);
    this.propagate(pos, { x: -1, y: 0 }, 0, color);
    this.propagate(pos, { x: 0, y: 1 }, 0, color);
    this.propagate(pos, { x: 0, y: -1 }, 0, color);
  }

  erasePixel(pos: Point): void {
    this.ctx.clearRect(pos.x, pos.y, 1, 1);
  }

  pickColor(pos: Point): HSV | null {
    const { a, ...hsv } = this.getHSVA(pos);

    return a > 0 ? hsv : null;
  }

  private propagate({ x, y }: Point, delta: Point, walked: number, color: HSV): void {
    x += delta.x;
    y += delta.y;
    walked += 1;

    if (x < 0 || y < 0 || x > this.width || y > this.height) return;

    const hsva = this.getHSVA({ x, y });

    if (hsva.a > 0) {
      const interpolate = interpolator("oklab", hsva, color);

      for (let i = 1; i < walked; i++) {
        x -= delta.x;
        y -= delta.y;
        this.ctx.fillStyle = rgbString(interpolate(i / walked));
        this.ctx.fillRect(x, y, 1, 1);
      }
    } else {
      this.propagate({ x, y }, delta, walked, color);
    }
  }
}
