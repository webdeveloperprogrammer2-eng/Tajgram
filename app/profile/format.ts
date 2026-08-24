// ============================================================
//  app/profile/format.ts
//  Funksiyahoi khurdi namoish: raqam va sana.
//  Hech so-rov ba server in jo nest.
// ============================================================

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

// "2026-08-22T09:00:55.188Z" -> "3 СОАТ ПЕШ"
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";

  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));

  if (seconds < 60) return "ҲОЗИР";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ДАҚ ПЕШ`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} СОАТ ПЕШ`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} РӮЗ ПЕШ`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ҲАФТА ПЕШ`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} МОҲ ПЕШ`;

  return `${Math.floor(days / 365)} СОЛ ПЕШ`;
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
