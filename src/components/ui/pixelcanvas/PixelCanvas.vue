<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Eraser, Download, Upload } from "@lucide/vue";
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
    pixelCanvas?.drawPixel(pixelCanvas.getMousePos(e), color.value);
  } else if (e.button === 1) {
    drawMode.value = null;

    const picked = pixelCanvas?.pickColor(pixelCanvas.getMousePos(e));

    if (picked) {
      setColor(picked);
    }
  } else if (e.button === 2) {
    drawMode.value = "eraser";
    pixelCanvas?.erasePixel(pixelCanvas.getMousePos(e));
  } else {
    drawMode.value = null;
  }
}

function onMouseMove(e: MouseEvent) {
  e.preventDefault();

  if (drawMode.value === "eraser") {
    pixelCanvas?.erasePixel(pixelCanvas.getMousePos(e));
  }
}

function onWindowMouseUp() {
  if (drawMode.value) {
    refreshPalette();
  }

  drawMode.value = null;
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

onMounted(() => {
  pixelCanvas = PixelCanvas.build(canvasRef.value);
  window.addEventListener("mouseup", onWindowMouseUp);
});
onUnmounted(() => window.removeEventListener("mouseup", onWindowMouseUp));
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
        class="w-full h-full [image-rendering:pixelated]"
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