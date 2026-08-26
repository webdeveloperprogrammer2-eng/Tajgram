import { timeAgo as sharedTimeAgo } from "@/lib/format";

// ============================================================
//  app/reels/format.ts
//  Funksiyahoi khurdi namoish: raqam va sana.
//  Hech so-rov ba server in jo nest.
// ============================================================

// 1250 -> "1.2K"
export function shortNumber(value: number | null | undefined): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;

  if (n < 1000) return String(n);

  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(n)
    .toUpperCase();
}

// "2026-08-22T09:00:55Z" -> "3 соат пеш"
export function timeAgo(iso: string | null | undefined): string {
  return sharedTimeAgo(iso);
}

// "Iso Samadov" -> "IS"
export function initials(name: string | null | undefined): string {
  const text = (name ?? "").trim();
  if (text === "") return "?";

  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}
