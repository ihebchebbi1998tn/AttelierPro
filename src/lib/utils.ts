import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  // If it's a whole number, return without decimals
  if (num % 1 === 0) {
    return num.toString();
  }
  
  // Otherwise, return with minimal decimal places (remove trailing zeros)
  return parseFloat(num.toFixed(3)).toString();
}
