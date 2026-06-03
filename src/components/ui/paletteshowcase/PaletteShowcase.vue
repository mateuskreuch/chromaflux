<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { type RGB } from "@/lib/color";
import { PaletteShowcase } from "./paletteShowcase";
import imageUrl from "@/assets/sol_dae_rokker.png";

const props = defineProps<{ palette: RGB[] }>();

const canvasRef = ref<HTMLCanvasElement>();
const paletteCanvas = ref<PaletteShowcase | null>(null);

onMounted(async () => {
  paletteCanvas.value = PaletteShowcase.build(canvasRef.value);

  await paletteCanvas.value?.loadImage(imageUrl);
  paletteCanvas.value?.recolor(props.palette);
});

watch(() => props.palette, () => paletteCanvas.value?.recolor(props.palette), { deep: true });
</script>

<template>
  <div class="flex flex-col gap-6 justify-between w-full h-full">
    <canvas
      ref="canvasRef"
      class="w-full object-contain border [image-rendering:pixelated]"
    />
    <div class="flex flex-col items-center text-center">
      <h1 class="text-xl font-bold tracking-tight">Palette Showcase</h1>
      <p class="mt-1 text-xs text-muted-foreground">Sol Dae Rokker, Metal Slug 3</p>
    </div>
  </div>
</template>