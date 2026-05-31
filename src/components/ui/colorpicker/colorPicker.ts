import { hsv2rgb, rgbString, type HSV } from "@/lib/color";
import { deg2rad, rad2deg, clamp } from "@/lib/utils";
import { Canvas, type Point } from "@/lib/canvas";

export class ColorPicker extends Canvas {
  protected readonly ringPickerSize: number;
  protected readonly svMargin: number;
  protected readonly svPickerRadius: number;
  protected readonly center: number;
  protected readonly ringOuterRadius: number;
  protected readonly ringInnerRadius: number;
  protected readonly svSize: number;
  protected readonly svStart: number;
  protected readonly svEnd: number;

  static override build(canvas: HTMLCanvasElement | undefined): ColorPicker | null {
    return super.build(canvas) as ColorPicker | null;
  }

  protected constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    super(canvas, ctx);

    const size = Math.min(canvas.width, canvas.height);
    const ringWidth = 0.03 * size;
    const ringMargin = 0.06 * size;

    this.ringPickerSize = 0.01 * size;
    this.svMargin = 0.03 * size;
    this.svPickerRadius = 0.015 * size;
    this.center = size / 2;
    this.ringOuterRadius = size / 2 - ringMargin;
    this.ringInnerRadius = this.ringOuterRadius - ringWidth;
    this.svSize = Math.ceil((this.ringInnerRadius - this.svMargin) * Math.SQRT2);
    this.svStart = this.center - this.svSize / 2;
    this.svEnd = this.svStart + this.svSize;
  }

  draw(color: HSV): void {
    const { ringPickerSize, center, ringOuterRadius, ringInnerRadius, svSize, svStart, svEnd } =
      this;

    this.clear();

    const hueGradient = this.ctx.createConicGradient(0, center, center);

    for (let i = 0; i <= 6; i++) {
      hueGradient.addColorStop(i / 6, `hsl(${i * 60}, 100%, 50%)`);
    }

    this.ctx.fillStyle = hueGradient;
    this.ctx.beginPath();
    this.ctx.arc(center, center, ringOuterRadius, 0, 2 * Math.PI, false);
    this.ctx.arc(center, center, ringInnerRadius, 0, 2 * Math.PI, true);
    this.ctx.fill("evenodd");

    this.drawHueCursor(color.h, ringPickerSize);
    this.drawHueCursor(color.h - 180, ringPickerSize / 2);
    this.drawHueCursor(color.h - 120, ringPickerSize / 2);
    this.drawHueCursor(color.h + 120, ringPickerSize / 2);

    this.ctx.fillStyle = rgbString(hsv2rgb({ h: color.h, s: 100, v: 100 }));
    this.ctx.fillRect(svStart, svStart, svSize, svSize);

    const saturationGradient = this.ctx.createLinearGradient(svStart, 0, svEnd, 0);
    saturationGradient.addColorStop(0, "rgb(255, 255, 255)");
    saturationGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    this.ctx.fillStyle = saturationGradient;
    this.ctx.fillRect(svStart, svStart, svSize, svSize);

    const valueGradient = this.ctx.createLinearGradient(0, svStart, 0, svEnd);
    valueGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    valueGradient.addColorStop(1, "rgb(0, 0, 0)");

    this.ctx.fillStyle = valueGradient;
    this.ctx.fillRect(svStart, svStart, svSize, svSize);

    this.drawSvCursor({
      x: svStart + svSize * (color.s / 100),
      y: svStart + svSize * (1 - color.v / 100),
    });
  }

  hueFromPos({ x, y }: Point): Pick<HSV, "h"> {
    const { center } = this;

    return { h: rad2deg(Math.atan2(y - center, x - center)) };
  }

  svFromPos({ x, y }: Point): Pick<HSV, "s" | "v"> {
    const { svSize, svStart } = this;

    return {
      s: 100 * clamp((x - svStart) / svSize, 0, 1),
      v: 100 * clamp(1 - (y - svStart) / svSize, 0, 1),
    };
  }

  isOnRing({ x, y }: Point): boolean {
    const { center, ringOuterRadius, ringInnerRadius } = this;
    const distance = Math.hypot(x - center, y - center);

    return distance >= ringInnerRadius && distance <= ringOuterRadius;
  }

  isOnSvSquare({ x, y }: Point): boolean {
    const { svStart, svEnd } = this;

    return x >= svStart && x <= svEnd && y >= svStart && y <= svEnd;
  }

  private drawSvCursor({ x, y }: Point): void {
    const { svPickerRadius } = this;

    this.ctx.beginPath();
    this.ctx.arc(x, y, svPickerRadius, 0, 2 * Math.PI);
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(x, y, svPickerRadius - 1, 0, 2 * Math.PI);
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private drawHueCursor(deg: number, size: number): void {
    const { center, ringOuterRadius } = this;

    const angle = deg2rad(deg);
    const height = size * 2.5;
    const halfBase = size * 1.5;
    const tipR = ringOuterRadius + 3;
    const baseR = tipR + height;

    const tipX = center + tipR * Math.cos(angle);
    const tipY = center + tipR * Math.sin(angle);
    const baseCX = center + baseR * Math.cos(angle);
    const baseCY = center + baseR * Math.sin(angle);
    const base1X = baseCX + halfBase * Math.cos(angle + Math.PI / 2);
    const base1Y = baseCY + halfBase * Math.sin(angle + Math.PI / 2);
    const base2X = baseCX - halfBase * Math.cos(angle + Math.PI / 2);
    const base2Y = baseCY - halfBase * Math.sin(angle + Math.PI / 2);

    this.ctx.beginPath();
    this.ctx.moveTo(tipX, tipY);
    this.ctx.lineTo(base1X, base1Y);
    this.ctx.lineTo(base2X, base2Y);
    this.ctx.closePath();
    this.ctx.fillStyle = "#fff";
    this.ctx.fill();
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
}
