<script setup lang="ts">
import { PixelCanvas } from "@/components/ui/pixelcanvas";
import { ColorPicker } from "@/components/ui/colorpicker";
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center overflow-auto bg-background p-4">
    <div class="flex flex-col sm:flex-row items-stretch gap-6">
      <PixelCanvas />
      <ColorPicker />
    </div>
  </div>
</template>
