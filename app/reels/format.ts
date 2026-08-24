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
  if (!iso) return "";

  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return "ҳозир";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} дақ пеш`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} соат пеш`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} рӯз пеш`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ҳафта пеш`;

  return new Date(iso).toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
