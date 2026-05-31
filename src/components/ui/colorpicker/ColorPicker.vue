<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { Input } from "@/components/ui/input";
import { setColor, useColor } from "@/composables/useColor";
import { wrap } from "@/lib/utils";
import { ColorPicker } from "./colorPicker";

const DISPLAY_SIZE = 512;

const { color } = useColor();

const dragMode = ref<"hue" | "sv" | null>(null);
const canvasRef = ref<HTMLCanvasElement>();

let colorPicker: ColorPicker | null;

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
  colorPicker = ColorPicker.build(canvasRef.value);
  colorPicker?.draw(color.value);
  window.addEventListener("mousemove", onWindowMouseMove);
  window.addEventListener("mouseup", onWindowMouseUp);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", onWindowMouseMove);
  window.removeEventListener("mouseup", onWindowMouseUp);
});

watch(color, () => colorPicker?.draw(color.value), { deep: true });
</script>

<template>
  <div class="flex flex-col gap-4 justify-between items-center">
    <canvas
      ref="canvasRef"
      :width="DISPLAY_SIZE"
      :height="DISPLAY_SIZE"
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