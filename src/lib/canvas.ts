import { rgb2hsv, type HSVA } from "@/lib/color";
import { clamp, newImage } from "@/lib/utils";

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

  async loadImage(src: string): Promise<void> {
    const img = await newImage(src);

    this.clear();
    this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
  }

  getPointerPos(e: MouseEvent | TouchEvent): Point {
    const { width, height } = this.canvas;
    const rect = this.canvas.getBoundingClientRect();

    const clientX = "touches" in e ? (e.touches[0] || e.changedTouches[0]).clientX : e.clientX;
    const clientY = "touches" in e ? (e.touches[0] || e.changedTouches[0]).clientY : e.clientY;

    const x = Math.floor(((clientX - rect.left) * width) / rect.width);
    const y = Math.floor(((clientY - rect.top) * height) / rect.height);

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
