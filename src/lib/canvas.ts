import { rgb2hsv, type HSVA } from "@/lib/color";
import { clamp } from "@/lib/utils";

export type Point = { x: number; y: number };

export class Canvas {
  protected readonly ctx: CanvasRenderingContext2D;
  protected readonly canvas: HTMLCanvasElement;

  static build(
    canvas: HTMLCanvasElement | null | undefined,
    options?: CanvasRenderingContext2DSettings,
  ): Canvas | null {
    const ctx = canvas?.getContext("2d", options);

    return canvas && ctx ? new this(canvas, ctx) : null;
  }

  protected constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  get width(): number {
    return this.canvas.width;
  }

  get height(): number {
    return this.canvas.height;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  toDataURL(type = "image/png"): string {
    return this.canvas.toDataURL(type);
  }

  loadImage(src: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        this.clear();
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        resolve();
      };
      img.src = src;
    });
  }

  getMousePos(e: MouseEvent): Point {
    const { width, height } = this.canvas;
    const rect = this.canvas.getBoundingClientRect();

    const x = Math.floor(((e.clientX - rect.left) * width) / rect.width);
    const y = Math.floor(((e.clientY - rect.top) * height) / rect.height);

    return {
      x: clamp(x, 0, width - 1),
      y: clamp(y, 0, height - 1),
    };
  }

  getHSVA({ x, y }: Point): HSVA {
    const { data } = this.ctx.getImageData(x, y, 1, 1);

    return { ...rgb2hsv(data[0], data[1], data[2]), a: data[3] };
  }
}
