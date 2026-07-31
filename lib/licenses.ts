import type { LicenseDuration } from "@/types/database";

export const DURATION_LABELS: Record<LicenseDuration, string> = {
  "1_day": "1 Day",
  "7_days": "7 Days",
  "14_days": "14 Days",
  "30_days": "30 Days",
  lifetime: "Lifetime",
};

export const DURATION_DAYS: Record<LicenseDuration, number | null> = {
  "1_day": 1,
  "7_days": 7,
  "14_days": 14,
  "30_days": 30,
  lifetime: null,
};

export function computeExpiresAt(duration: LicenseDuration, from: Date = new Date()): Date | null {
  const days = DURATION_DAYS[duration];
  if (days === null) return null;
  const expires = new Date(from);
  expires.setDate(expires.getDate() + days);
  return expires;
}

export function daysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null; // lifetime
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false; // lifetime never expires
  return new Date(expiresAt).getTime() < Date.now();
}

/** Generates a key formatted like VOXY-8H2K-91JD-QK2P */
export function generateLicenseKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid ambiguity
  const randomGroup = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `VOXY-${randomGroup()}-${randomGroup()}-${randomGroup()}`;
}
