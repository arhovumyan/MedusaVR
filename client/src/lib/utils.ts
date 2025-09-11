import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format coin amounts for display, truncating large numbers with ellipsis
 * @param amount - The coin amount to format
 * @param maxLength - Maximum length before truncating (default: 6 for mobile, 8 for desktop)
 * @param isMobile - Whether to use mobile-optimized formatting
 * @returns Formatted string with optional ellipsis
 */
export function formatCoins(amount: number, maxLength: number = 6): string {
  if (amount === 0) return "0";
  
  // For very large numbers, use K/M/B notation
  if (amount >= 1000000000) {
    const formatted = (amount / 1000000000).toFixed(1) + "B";
    return formatted.length > maxLength ? `${formatted.slice(0, maxLength - 3)}...` : formatted;
  } else if (amount >= 1000000) {
    const formatted = (amount / 1000000).toFixed(1) + "M";
    return formatted.length > maxLength ? `${formatted.slice(0, maxLength - 3)}...` : formatted;
  } else if (amount >= 10000) {
    const formatted = (amount / 1000).toFixed(1) + "K";
    return formatted.length > maxLength ? `${formatted.slice(0, maxLength - 3)}...` : formatted;
  } else {
    const formatted = amount.toLocaleString();
    if (formatted.length > maxLength) {
      return `${formatted.slice(0, maxLength - 3)}...`;
    }
    return formatted;
  }
}
