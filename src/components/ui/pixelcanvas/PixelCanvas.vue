<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Eraser, Download, Upload, Pencil, File } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { setColor, useColor } from "@/composables/useColor";
import type { RGB } from "@/lib/color";
import { PixelCanvas } from "./pixelCanvas";

const GRID_SIZE = 32;

const { color } = useColor();

const emit = defineEmits<{
  (e: "palette-change", palette: RGB[]): void;
}>();

const drawMode = ref<null | "pencil" | "eraser">(null);
const canvasRef = ref<HTMLCanvasElement>();

let pixelCanvas: PixelCanvas | null = null;

function refreshPalette() {
  if (pixelCanvas) {
    emit("palette-change", pixelCanvas.getUniqueColors());
  }
}

function onMouseDown(e: MouseEvent) {
  e.preventDefault();

  if (e.button === 0) {
    drawMode.value = "pencil";
    pixelCanvas?.drawPixel(pixelCanvas.getPointerPos(e), color.value);
  } else if (e.button === 1) {
    drawMode.value = null;

    const picked = pixelCanvas?.pickColor(pixelCanvas.getPointerPos(e));

    if (picked) {
      setColor(picked);
    }
  } else if (e.button === 2) {
    drawMode.value = "eraser";
    pixelCanvas?.erasePixel(pixelCanvas.getPointerPos(e));
  } else {
    drawMode.value = null;
  }
}

function onTouchStart(e: TouchEvent) {
  if (!drawMode.value) {
    drawMode.value = "pencil";
  }

  if (drawMode.value === "pencil") {
    pixelCanvas?.drawPixel(pixelCanvas.getPointerPos(e), color.value);
  } else if (drawMode.value === "eraser") {
    pixelCanvas?.erasePixel(pixelCanvas.getPointerPos(e));
  }
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  e.preventDefault();

  if (drawMode.value === "eraser") {
    pixelCanvas?.erasePixel(pixelCanvas.getPointerPos(e));
  }
}

function onWindowPointerUp(e: MouseEvent | TouchEvent) {
  if (drawMode.value) {
    refreshPalette();
  }

  if (e.target === canvasRef.value) {
    drawMode.value = null;
  }
}

function clearCanvas() {
  if (confirm("Are you sure you want to clear the canvas?")) {
    pixelCanvas?.clear();
    refreshPalette();
  }
}

function saveCanvas() {
  const filename = prompt("Enter a filename:", "palette");

  if (!filename) return;

  const dataUrl = pixelCanvas?.toDataURL();

  if (!dataUrl) return;

  const link = document.createElement("a");
  link.download = `${filename || "palette"}.png`;
  link.href = dataUrl;
  link.click();
}

function loadCanvas(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = (event) => {
    pixelCanvas?.loadImage(event.target?.result as string).then(() => {
      refreshPalette();
    });
  };
  reader.readAsDataURL(file);
}

function toggleDrawMode(mode: "pencil" | "eraser") {
  drawMode.value = drawMode.value === mode ? null : mode;
}

onMounted(() => {
  pixelCanvas = PixelCanvas.build(canvasRef.value);
  window.addEventListener("mouseup", onWindowPointerUp);
  window.addEventListener("touchend", onWindowPointerUp);
});
onUnmounted(() => {
  window.removeEventListener("mouseup", onWindowPointerUp);
  window.removeEventListener("touchend", onWindowPointerUp);
});
</script>

<template>
  <div class="flex flex-col gap-6 justify-between w-full h-full">
    <div
      class="checkerboard cursor-crosshair select-none aspect-square w-full"
      @contextmenu.prevent
    >
      <canvas
        ref="canvasRef"
        :width="GRID_SIZE"
        :height="GRID_SIZE"
        class="w-full h-full [image-rendering:pixelated] touch-none"
        @mousedown="onMouseDown"
        @mousemove="onPointerMove"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onPointerMove"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Button :variant="drawMode === 'pencil' ? 'default' : 'secondary'" title="Pencil" @click="toggleDrawMode('pencil')">
        <Pencil class="w-4 h-4" />
      </Button>

      <Button :variant="drawMode === 'eraser' ? 'default' : 'secondary'" title="Eraser" @click="toggleDrawMode('eraser')">
        <Eraser class="w-4 h-4" />
      </Button>

      <Button variant="secondary" class="flex-1" title="Clear Canvas" @click="clearCanvas">
        <File class="w-4 h-4 mr-2" />
        New
      </Button>

      <Button variant="secondary" class="flex-1" title="Save PNG" @click="saveCanvas">
        <Download class="w-4 h-4 mr-2" />
        Save
      </Button>

      <Button variant="default" class="flex-1" as-child>
        <Label class="flex items-center justify-center">
          <Upload class="w-4 h-4 mr-2" />
          Load
          <input type="file" accept="image/png" class="hidden" @click="($event.target as HTMLInputElement).value = ''"  @change="loadCanvas" />
        </Label>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.checkerboard {
  background-color: #777;
  background-image:
    linear-gradient(45deg, #666 25%, transparent 25%),
    linear-gradient(-45deg, #666 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #666 75%),
    linear-gradient(-45deg, transparent 75%, #666 75%);
  background-size: 3.125% 3.125%;
  background-position: 0 0, 0 1.5625%, 1.5625% -1.5625%, -1.5625% 0px;
}
</style>