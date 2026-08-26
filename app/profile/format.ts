// ============================================================
//  app/profile/format.ts
//  Funksiyahoi khurdi namoish: raqam va sana.
//  Hech so-rov ba server in jo nest.
// ============================================================
import { timeAgo as sharedTimeAgo } from "@/lib/format";

// 1250 -> "1.2K"  (monandi instagram)
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

// "2026-08-22T09:00:55.188Z" -> "3 SOAT PESH" (bo zaboni jori)
// Yak nusxa dar lib/format.ts ast - in jo faqat HARFI KALON.
export function timeAgo(iso: string | null | undefined): string {
  return sharedTimeAgo(iso).toUpperCase();
}

// "2026-08-22T09:00:55.188Z" -> "22.08.2026"
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${day}.${month}.${date.getFullYear()}`;
}

// Harfi avvali nom - baroi avatar-i kholi
export function initials(name: string | null | undefined): string {
  const clean = (name ?? "").trim();
  if (clean === "") return "?";

  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join("").toUpperCase();
}

// gender: 0 | 1 | null  ->  matni khonda
export function genderLabel(gender: number | null | undefined): string {
  if (gender === 0) return "МАРД";
  if (gender === 1) return "ЗАН";
  return "НОМАЪЛУМ";
}
