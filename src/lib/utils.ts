import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function safePercent(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  return Math.max(0, Math.min(100, (numerator / denominator) * 100));
}
