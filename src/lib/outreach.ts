export const OUTREACH_STATUSES = [
  "No response",
  "Replied",
  "In talks",
  "Deal closed",
  "Rejected",
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const DEFAULT_REASONS = [
  "OTC",
  "Market Making",
  "Marketing",
  "Exchange Listing",
  "Growth Partnership",
] as const;

/** Sentinel option shown at the end of the reason dropdown. */
export const OTHER_REASON = "Other";

/**
 * Normalize an outreach location so it is always a usable URL.
 * "t.me/username" → "https://t.me/username". Already-absolute URLs
 * (http:// or https://) are left untouched.
 */
export function normalizeLocation(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Today's date as a yyyy-mm-dd string in the user's local timezone. */
export function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
