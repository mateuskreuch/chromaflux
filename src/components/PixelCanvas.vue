<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Eraser, Download, Upload } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { setColor, useColor } from "@/composables/useColor";
import { hsv2rgb, interpolator, rgbString } from "@/lib/color";
import { getHSVA, getMousePos, type Point } from "@/lib/canvas";

const GRID_SIZE = 32;
const DISPLAY_SIZE = 512;

const { color } = useColor();

const drawMode = ref<null | "pencil" | "eraser">(null);
const canvasRef = ref<HTMLCanvasElement>();

let ctx: CanvasRenderingContext2D;

function propagate({ x, y }: Point, delta: Point, walked: number) {
  x += delta.x;
  y += delta.y;
  walked += 1;

  if (x < 0 || y < 0 || x > GRID_SIZE || y > GRID_SIZE) {
    return;
  }

  const hsva = getHSVA(ctx, { x, y });

  if (hsva.a > 0) {
    const interpolate = interpolator("oklab", hsva, color.value);

    for (let i = 1; i < walked; i++) {
      x -= delta.x;
      y -= delta.y;

      ctx.fillStyle = rgbString(interpolate(i / walked));
      ctx.fillRect(x, y, 1, 1);
    }
  } else {
    propagate({ x, y }, delta, walked);
  }
}

function drawAt(e: MouseEvent) {
  if (drawMode.value === null) {
    return;
  }

  const pos = getMousePos(e, canvasRef.value!);

  if (drawMode.value === "eraser") {
    ctx.clearRect(pos.x, pos.y, 1, 1);
  } else {
    ctx.fillStyle = rgbString(hsv2rgb(color.value));
    ctx.fillRect(pos.x, pos.y, 1, 1);

    propagate(pos, { x: 1, y: 0 }, 0);
    propagate(pos, { x: -1, y: 0 }, 0);
    propagate(pos, { x: 0, y: 1 }, 0);
    propagate(pos, { x: 0, y: -1 }, 0);
  }
}

function pickColor(e: MouseEvent) {
  const pos = getMousePos(e, canvasRef.value!);
  const { a, ...hsv } = getHSVA(ctx, pos);

  if (a > 0) {
    setColor(hsv);
  }
}

function onMouseDown(e: MouseEvent) {
  e.preventDefault();

  if (e.button === 0) {
    drawMode.value = "pencil";
    drawAt(e);
  } else if (e.button === 1) {
    drawMode.value = null;
    pickColor(e);
  } else if (e.button === 2) {
    drawMode.value = "eraser";
    drawAt(e);
  } else {
    drawMode.value = null;
  }
}

function onMouseMove(e: MouseEvent) {
  e.preventDefault();

  if (drawMode.value === "eraser") {
    drawAt(e);
  }
}

function onWindowMouseUp() {
  drawMode.value = null;
}

function clearCanvas() {
  if (confirm("Are you sure you want to clear the canvas?")) {
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
  }
}

function saveCanvas() {
  const filename = prompt("Enter a filename:", "palette");

  if (filename != null) {
    const link = document.createElement("a");

    link.download = `${filename || "palette"}.png`;
    link.href = canvasRef.value!.toDataURL("image/png");
    link.click();
  }
}

function loadCanvas(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
        ctx.drawImage(img, 0, 0, GRID_SIZE, GRID_SIZE);
      };
      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  }
}

onMounted(() => {
  // ctx can be null, but it's easier to just let everything throw
  ctx = canvasRef.value?.getContext("2d", { willReadFrequently: true })!;

  window.addEventListener("mouseup", onWindowMouseUp);
});
onUnmounted(() => window.removeEventListener("mouseup", onWindowMouseUp));
</script>

<template>
  <div class="flex flex-col gap-4 justify-between">
    <div
      class="checkerboard cursor-crosshair select-none ring-1 ring-border"
      :style="{ width: `${DISPLAY_SIZE}px`, height: `${DISPLAY_SIZE}px` }"
      @contextmenu.prevent
    >
      <canvas
        ref="canvasRef"
        :width="GRID_SIZE"
        :height="GRID_SIZE"
        :style="{ display: 'block', width: `${DISPLAY_SIZE}px`, height: `${DISPLAY_SIZE}px`, imageRendering: 'pixelated' }"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
      />
    </div>

    <div class="flex items-center gap-2">
      <Button variant="secondary" class="flex-1" title="Clear Canvas" @click="clearCanvas">
        <Eraser class="w-4 h-4 mr-2" />
        Clear
      </Button>

      <Button variant="secondary" class="flex-1" title="Save PNG" @click="saveCanvas">
        <Download class="w-4 h-4 mr-2" />
        Save
      </Button>

      <Button variant="default" class="flex-1" as-child>
        <Label class="flex items-center justify-center">
          <Upload class="w-4 h-4 mr-2" />
          Load
          <input type="file" accept="image/png" class="hidden" @change="loadCanvas" />
        </Label>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.checkerboard {
  background-color: #bbb;
  background-image:
    linear-gradient(45deg, #999 25%, transparent 25%),
    linear-gradient(-45deg, #999 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #999 75%),
    linear-gradient(-45deg, transparent 75%, #999 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}
</style>
