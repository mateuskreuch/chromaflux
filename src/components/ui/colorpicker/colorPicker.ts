import { hsv2rgb, rgbString, type HSV } from "@/lib/color";
import { deg2rad, rad2deg, clamp, closestEven } from "@/lib/utils";
import { Canvas, type Point } from "@/lib/canvas";

export class ColorPicker extends Canvas {
  protected readonly cursorRadius: number;
  protected readonly center: number;
  protected readonly ringOuterRadius: number;
  protected readonly ringInnerRadius: number;
  protected readonly ringCenterRadius: number;
  protected readonly svSize: number;
  protected readonly svStart: number;
  protected readonly svEnd: number;
  protected readonly svOutline: number;

  static override build(canvas: HTMLCanvasElement | undefined): ColorPicker | null {
    return super.build(canvas) as ColorPicker | null;
  }

  protected constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    super(canvas, ctx);

    const size = closestEven(Math.min(canvas.width, canvas.height));

    this.cursorRadius = Math.ceil(0.022 * size);
    this.center = size / 2;
    this.ringOuterRadius = size / 2;
    this.ringInnerRadius = this.ringOuterRadius - 2 * this.cursorRadius;
    this.ringCenterRadius = Math.floor((this.ringOuterRadius + this.ringInnerRadius) / 2);
    this.svSize = closestEven((this.ringInnerRadius - 1.8 * this.cursorRadius) * Math.SQRT2);
    this.svStart = this.center - this.svSize / 2;
    this.svEnd = this.svStart + this.svSize;
    this.svOutline = Math.ceil(0.0025 * size);
  }

  draw(color: HSV): void {
    const { center, ringOuterRadius, ringInnerRadius, svSize, svStart, svEnd } = this;

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

    const hueAngle = deg2rad(color.h);

    this.drawCursor({
      x: center + this.ringCenterRadius * Math.cos(hueAngle),
      y: center + this.ringCenterRadius * Math.sin(hueAngle),
    });

    this.ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    this.ctx.fillRect(
      svStart - this.svOutline,
      svStart - this.svOutline,
      svSize + 2 * this.svOutline,
      svSize + 2 * this.svOutline,
    );

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

    this.drawCursor({
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

  private drawCursor({ x, y }: Point, radius: number = this.cursorRadius): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius - 1, 0, 2 * Math.PI);
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius - 2, 0, 2 * Math.PI);
    this.ctx.strokeStyle = "#000";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
}
