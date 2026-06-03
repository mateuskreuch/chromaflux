import {
  type RGB,
  rgb2oklab,
  closestColor,
  imageData2rgba,
  hashRgb,
  type Oklab,
} from "@/lib/color";
import { Canvas } from "@/lib/canvas";
import { minAndMax, newImage } from "@/lib/utils";

export class PaletteShowcase extends Canvas {
  private originalImageData: ImageData | null = null;
  private originalMinL = 0;
  private originalMaxL = 1;

  static override build(canvas: HTMLCanvasElement | undefined): PaletteShowcase | null {
    return super.build(canvas, {
      willReadFrequently: true,
    }) as PaletteShowcase | null;
  }

  override async loadImage(src: string): Promise<void> {
    const img = await newImage(src);

    this.canvas.width = img.width;
    this.canvas.height = img.height;

    this.clear();
    this.ctx.drawImage(img, 0, 0);

    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    const lightness = minAndMax(
      imageData2rgba(imageData)
        .filter((rgba) => rgba.a > 0)
        .map(rgb2oklab)
        .map((lab) => lab.l),
    );

    this.originalImageData = imageData;
    this.originalMinL = lightness.min;
    this.originalMaxL = lightness.max;
  }

  recolor(palette: RGB[]): void {
    if (!this.originalImageData) return;

    if (palette.length <= 1) {
      this.ctx.putImageData(this.originalImageData, 0, 0);
      return;
    }

    const closestCache = new Map<number, RGB>();
    const paletteOklab = palette.map(rgb2oklab);
    const { min: paletteMinL, max: paletteMaxL } = minAndMax(paletteOklab.map((lab) => lab.l));
    const recoloredData = [];

    for (const { a, ...rgb } of imageData2rgba(this.originalImageData)) {
      if (a === 0) {
        recoloredData.push(0, 0, 0, 0);
        continue;
      }

      const key = hashRgb(rgb);
      let closest = closestCache.get(key);

      if (!closest) {
        const lab = this.adjustLightness(rgb, paletteMinL, paletteMaxL);

        closest = closestColor(lab, paletteOklab);
        closestCache.set(key, closest);
      }

      recoloredData.push(closest.r, closest.g, closest.b, a);
    }

    const newImageData = new ImageData(
      new Uint8ClampedArray(recoloredData),
      this.originalImageData.width,
      this.originalImageData.height,
    );

    this.ctx.putImageData(newImageData, 0, 0);
  }

  private adjustLightness(rgb: RGB, targetMinL: number, targetMaxL: number): Oklab {
    const originalRange = this.originalMaxL - this.originalMinL;
    const targetRange = targetMaxL - targetMinL;
    const lab = rgb2oklab(rgb);

    if (originalRange > 0 && targetRange > 0) {
      lab.l = targetMinL + ((lab.l - this.originalMinL) * targetRange) / originalRange;
    }

    return lab;
  }
}
