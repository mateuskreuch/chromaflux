<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import {
  NumberField,
  NumberFieldInput,
} from '@/components/ui/number-field'
import { setColor, useColor } from "@/composables/useColor";
import { wrap } from "@/lib/utils";
import { ColorPicker } from "./colorPicker";
import { hsv2rgb, rgbString } from "@/lib/color";

const { color } = useColor();

const dragMode = ref<"hue" | "sv" | null>(null);
const canvasRef = ref<HTMLCanvasElement>();

let colorPicker: ColorPicker | null;
let resizeObserver: ResizeObserver | null = null;

function updateCanvasSize() {
  if (!canvasRef.value) return;

  const rect = canvasRef.value.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvasRef.value.width = rect.width * dpr;
  canvasRef.value.height = rect.height * dpr;

  colorPicker = ColorPicker.build(canvasRef.value);
  colorPicker?.draw(color.value);
}

function onMouseDown(e: MouseEvent) {
  if (!colorPicker) return;

  e.preventDefault();

  const pos = colorPicker.getMousePos(e);

  if (colorPicker.isOnRing(pos)) {
    dragMode.value = "hue";
    setColor(colorPicker.hueFromPos(pos));
  } else if (colorPicker.isOnSvSquare(pos)) {
    dragMode.value = "sv";
    setColor(colorPicker.svFromPos(pos));
  }
}

function onWindowMouseMove(e: MouseEvent) {
  if (!dragMode.value || !colorPicker) return;

  e.preventDefault();

  if (dragMode.value === "hue") {
    setColor(colorPicker.hueFromPos(colorPicker.getMousePos(e)));
  } else {
    setColor(colorPicker.svFromPos(colorPicker.getMousePos(e)));
  }
}

function onWindowMouseUp() {
  dragMode.value = null;
}

onMounted(() => {
  if (canvasRef.value) {
    updateCanvasSize();

    resizeObserver = new ResizeObserver(updateCanvasSize);

    resizeObserver.observe(canvasRef.value);
  }

  window.addEventListener("mousemove", onWindowMouseMove);
  window.addEventListener("mouseup", onWindowMouseUp);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("mousemove", onWindowMouseMove);
  window.removeEventListener("mouseup", onWindowMouseUp);
});

watch(color, () => colorPicker?.draw(color.value), { deep: true });
</script>

<template>
  <div class="flex flex-col gap-6 justify-between w-full h-full">
    <div class="aspect-square w-full">
      <canvas
        ref="canvasRef"
        class="w-full h-full cursor-crosshair select-none"
        @mousedown="onMouseDown"
      />
    </div>
    <div class="flex items-center gap-2">
      <span class="text-xs text-muted-foreground text-right">H</span>
      <NumberField
        :model-value="color.h"
        @update:model-value="(val) => color.h = wrap(+val, 0, 360)"
      >
        <NumberFieldInput class="w-12" />
      </NumberField>
      <span class="text-xs text-muted-foreground text-right">S</span>
      <NumberField
        :model-value="color.s"
        @update:model-value="(val) => color.s = wrap(+val, 0, 100)"
      >
        <NumberFieldInput class="w-12" />
      </NumberField>
      <span class="text-xs text-muted-foreground text-right">V</span>
      <NumberField
        :model-value="color.v"
        @update:model-value="(val) => color.v = wrap(+val, 0, 100)"
      >
        <NumberFieldInput class="w-12" />
      </NumberField>
      <div class="ml-3 flex-1 h-9 rounded-md" :style="{
        backgroundColor: rgbString(hsv2rgb(color)),
      }" />
    </div>
  </div>
</template>