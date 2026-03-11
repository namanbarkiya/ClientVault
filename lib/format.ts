import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns"

/** Format a date as "Mar 10, 2026" */
export function formatDate(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy")
}

/** Format a date as "Mar 10, 2026 at 3:42 PM" */
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a")
}

/** "2 hours ago", "yesterday", "Mar 10" depending on recency */
export function formatRelative(date: string | Date): string {
  const d = new Date(date)
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true })
  if (isYesterday(d)) return "Yesterday"
  return format(d, "MMM d")
}

/** Format a number as currency: 1234.5 → "$1,234.50" */
export function formatCurrency(amount: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount)
}

/** Format a number with commas: 1234567 → "1,234,567" */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n)
}

/** Compact number: 1234 → "1.2K", 1234567 → "1.2M" */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n)
}

/** Truncate a string with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + "…"
}

/** "john doe" → "John Doe" */
export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

/** Get initials from a name: "John Doe" → "JD" */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
