import { ref } from "vue";
import type { HSV } from "../lib/color";
import { clamp, wrap } from "@/lib/utils";

const color = ref<HSV>({ h: 0, s: 100, v: 100 });

export function useColor() {
  return { color };
}

export function setColor({ h, s, v }: Partial<HSV>) {
  color.value = {
    h: h != null ? Math.round(wrap(h, 0, 360)) : color.value.h,
    s: s != null ? Math.round(clamp(s, 0, 100)) : color.value.s,
    v: v != null ? Math.round(clamp(v, 0, 100)) : color.value.v,
  };
}
