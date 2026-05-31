<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { Input } from "@/components/ui/input";
import { hsv2rgb, rgbString } from "@/lib/color";
import { setColor, useColor } from "@/composables/useColor";
import { clamp, deg2rad, rad2deg, wrap } from "@/lib/utils";
import { getMousePos, type Point } from "@/lib/canvas";

const { color } = useColor();

const dragMode = ref<"hue" | "sv" | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

let ctx: CanvasRenderingContext2D;

const SIZE = 512;
const RING_W = 16;
const RING_MARGIN = 32;
const SV_MARGIN = 2;
const CENTER_X = SIZE / 2;
const CENTER_Y = SIZE / 2;
const OUTER_R = SIZE / 2 - RING_MARGIN;
const INNER_R = OUTER_R - RING_W;
const SV_HALF = Math.floor(((INNER_R - SV_MARGIN) * Math.SQRT2) / 2);
const SV_SIZE = 2 * SV_HALF;
const SV_X = CENTER_X - SV_HALF;
const SV_Y = CENTER_Y - SV_HALF;

function drawSvCursor({ x, y }: Point) {
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawHueCursor(deg: number, size: number) {
  const angle = deg2rad(deg);
  const height = size * 2.5;
  const halfBase = size * 1.5;
  const tipR = OUTER_R + 3;
  const baseR = tipR + height;

  const tipX = CENTER_X + tipR * Math.cos(angle);
  const tipY = CENTER_Y + tipR * Math.sin(angle);
  const baseCX = CENTER_X + baseR * Math.cos(angle);
  const baseCY = CENTER_Y + baseR * Math.sin(angle);
  const base1X = baseCX + halfBase * Math.cos(angle + Math.PI / 2);
  const base1Y = baseCY + halfBase * Math.sin(angle + Math.PI / 2);
  const base2X = baseCX - halfBase * Math.cos(angle + Math.PI / 2);
  const base2Y = baseCY - halfBase * Math.sin(angle + Math.PI / 2);

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(base1X, base1Y);
  ctx.lineTo(base2X, base2Y);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function draw() {
  ctx.clearRect(0, 0, SIZE, SIZE);

  const hueGradient = ctx.createConicGradient(0, CENTER_X, CENTER_Y);

  for (let i = 0; i <= 6; i++) {
    hueGradient.addColorStop(i / 6, `hsl(${i * 60}, 100%, 50%)`);
  }

  ctx.fillStyle = hueGradient;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, OUTER_R, 0, 2 * Math.PI, false);
  ctx.arc(CENTER_X, CENTER_Y, INNER_R, 0, 2 * Math.PI, true);
  ctx.fill("evenodd");

  drawHueCursor(color.value.h, 5);
  drawHueCursor(color.value.h - 180, 2);
  drawHueCursor(color.value.h - 120, 2);
  drawHueCursor(color.value.h + 120, 2);

  ctx.fillStyle = rgbString(hsv2rgb({ h: color.value.h, s: 100, v: 100 }));
  ctx.fillRect(SV_X, SV_Y, SV_SIZE, SV_SIZE);

  const saturationGradient = ctx.createLinearGradient(
    SV_X,
    0,
    SV_X + SV_SIZE,
    0,
  );
  saturationGradient.addColorStop(0, "#fff");
  saturationGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = saturationGradient;
  ctx.fillRect(SV_X, SV_Y, SV_SIZE, SV_SIZE);

  const valueGradient = ctx.createLinearGradient(0, SV_Y, 0, SV_Y + SV_SIZE);
  valueGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  valueGradient.addColorStop(1, "#000");

  ctx.fillStyle = valueGradient;
  ctx.fillRect(SV_X, SV_Y, SV_SIZE, SV_SIZE);

  drawSvCursor({
    x: SV_X + SV_SIZE * (color.value.s / 100),
    y: SV_Y + SV_SIZE * (1 - color.value.v / 100),
  });
}

function updateHue({ x, y }: Point) {
  setColor({
    h: rad2deg(Math.atan2(y - CENTER_Y, x - CENTER_X)),
  });
}

function updateSv({ x, y }: Point) {
  setColor({
    s: 100 * clamp((x - SV_X) / SV_SIZE, 0, 1),
    v: 100 * clamp(1 - (y - SV_Y) / SV_SIZE, 0, 1),
  });
}

function isPosOnRing({ x, y }: Point) {
  const d = Math.hypot(x - CENTER_X, y - CENTER_Y);

  return d >= INNER_R && d <= OUTER_R;
}

function isPosOnSvSquare({ x, y }: Point) {
  return x >= SV_X && x <= SV_X + SV_SIZE && y >= SV_Y && y <= SV_Y + SV_SIZE;
}

function onMouseDown(e: MouseEvent) {
  e.preventDefault();

  const pos = getMousePos(e, canvasRef.value!);

  if (isPosOnRing(pos)) {
    dragMode.value = "hue";
    updateHue(pos);
  } else if (isPosOnSvSquare(pos)) {
    dragMode.value = "sv";
    updateSv(pos);
  }
}

function onWindowMouseMove(e: MouseEvent) {
  if (!dragMode.value) {
    return;
  }

  e.preventDefault();

  const pos = getMousePos(e, canvasRef.value!);

  if (dragMode.value === "hue") {
    updateHue(pos);
  } else {
    updateSv(pos);
  }
}

function onWindowMouseUp() {
  dragMode.value = null;
}

onMounted(() => {
  // ctx can be null, but it's easier to just let everything throw
  ctx = canvasRef.value?.getContext("2d")!;

  draw();
  window.addEventListener("mousemove", onWindowMouseMove);
  window.addEventListener("mouseup", onWindowMouseUp);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", onWindowMouseMove);
  window.removeEventListener("mouseup", onWindowMouseUp);
});

watch(color, draw, { deep: true });
</script>

<template>
  <div class="flex flex-col gap-4 justify-between items-center">
    <canvas
      ref="canvasRef"
      :width=SIZE
      :height=SIZE
      class="cursor-crosshair select-none"
      @mousedown="onMouseDown"
    />
    <div class="flex items-center gap-1.5">
      <span class="text-xs text-muted-foreground w-4 text-right">H</span>
      <Input
        :model-value="color.h"
        type="number"
        class="w-16 font-mono"
        @update:model-value="(val) => color.h = wrap(+val, 0, 360)"
      />
      <span class="text-xs text-muted-foreground w-4 text-right">S</span>
      <Input
        :model-value="color.s"
        type="number"
        class="w-16 font-mono"
        @update:model-value="(val) => color.s = wrap(+val, 0, 100)"
      />
      <span class="text-xs text-muted-foreground w-4 text-right">V</span>
      <Input
        :model-value="color.v"
        type="number"
        class="w-16 font-mono"
        @update:model-value="(val) => color.v = wrap(+val, 0, 100)"
      />
    </div>
  </div>
</template>
