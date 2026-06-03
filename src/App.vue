<script setup lang="ts">
import { ref } from "vue";
import { PixelCanvas } from "@/components/ui/pixelcanvas";
import { ColorPicker } from "@/components/ui/colorpicker";
import { useColorMode } from "@vueuse/core";
import { PaletteShowcase } from "@/components/ui/paletteshowcase";
import { Card, CardContent } from "@/components/ui/card";
import type { RGB } from "@/lib/color";

const palette = ref<RGB[]>([]);
const mode = useColorMode();

mode.value = "dark";
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center">
    <header class="absolute inset-x-0 top-0 flex flex-col items-center gap-6 p-6 pt-16">
      <img
        src="./assets/logo.png"
        alt="Pixel Art Creator Logo"
        class="w-full max-w-lg object-contain [image-rendering:pixelated]"
      />
      <h2 class="text-md text-center text-muted-foreground w-full">
        A pixel art palette creator.
      </h2>
    </header>
    <main class="flex flex-row gap-6 items-stretch w-full max-w-[1600px] p-6">
      <Card class="flex-1">
        <CardContent class="h-full">
          <ColorPicker />
        </CardContent>
      </Card>

      <Card class="flex-1">
        <CardContent class="h-full">
          <PixelCanvas @palette-change="palette = $event" />
        </CardContent>
      </Card>

      <Card class="flex-1">
        <CardContent class="h-full">
          <PaletteShowcase :palette="palette" />
        </CardContent>
      </Card>
    </main>
  </div>
</template>