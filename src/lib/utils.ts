import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function shadeColor(color: string, percent: number) {
  let hex = color;
  if (hex.startsWith('#')) hex = hex.slice(1);
  const R = parseInt(hex.substring(0, 2), 16);
  const G = parseInt(hex.substring(2, 4), 16);
  const B = parseInt(hex.substring(4, 6), 16);
  const newR = Math.min(255, Math.max(0, R + (R * percent / 100)));
  const newG = Math.min(255, Math.max(0, G + (G * percent / 100)));
  const newB = Math.min(255, Math.max(0, B + (B * percent / 100)));
  return `rgb(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)})`;
}
