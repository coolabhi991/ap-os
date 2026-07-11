import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formats a money value as Indian Rupees, e.g. formatCurrency(150000) -> "₹1,50,000". */
export function formatCurrency(value: string | number): string {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

/** Formats a plain quantity/number using Indian digit grouping, e.g. "1,50,000" (no currency symbol). */
export function formatIndianNumber(value: string | number): string {
  return Number(value).toLocaleString("en-IN");
}

/** Today's date as YYYY-MM-DD, for defaulting <input type="date"> values. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Formats an ISO date/timestamp string for display, e.g. "11 Jul 2026". */
export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
