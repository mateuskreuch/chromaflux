import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const TAU = 2 * Math.PI;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function wrap(value: number, min: number, max: number) {
  const range = max - min;

  return ((((value - min) % range) + range) % range) + min;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function deg2rad(deg: number) {
  return (wrap(deg, 0, 360) / 360) * TAU;
}

export function rad2deg(rad: number) {
  return wrap((rad / TAU) * 360, 0, 360);
}
