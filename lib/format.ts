import { readLang, type Lang } from "@/components/appLang";

// ------------------------------------------------------------
//  Vaqti nisbi ("3 soat pesh") - dar HAR SE zabon.
//
//  KHATO BUD: se nusxai gunogun budand - lib/format.ts anglisi,
//  app/profile/format.ts tojikii lotini, app/reels/format.ts ham
//  tojikii lotini. Dar yak sahifa se zabon yakjo namoyon meshud.
//  Hozir HAMA az hamin jadval megirand.
// ------------------------------------------------------------
type Unit = "min" | "hour" | "day" | "week" | "month" | "year";

const AGO: Record<Lang, { now: string; short: string; unit: Record<Unit, string> }> = {
  tj: {
    now: "ҳозир",
    short: "ҳозир",
    unit: {
      min: "дақ пеш",
      hour: "соат пеш",
      day: "рӯз пеш",
      week: "ҳафта пеш",
      month: "моҳ пеш",
      year: "сол пеш",
    },
  },
  ru: {
    now: "только что",
    short: "сейчас",
    unit: {
      min: "мин назад",
      hour: "ч назад",
      day: "д назад",
      week: "нед назад",
      month: "мес назад",
      year: "г назад",
    },
  },
  en: {
    now: "just now",
    short: "now",
    unit: {
      min: "min ago",
      hour: "h ago",
      day: "d ago",
      week: "w ago",
      month: "mo ago",
      year: "y ago",
    },
  },
};

/** «1 soat pesh» / «1 hour ago» / «1 ч назад» - vobasta ba zabon. */
export function timeAgo(iso?: string | null, lang: Lang = readLang()): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const words = AGO[lang];
  const say = (value: number, unit: Unit) => `${value} ${words.unit[unit]}`;

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return words.now;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return say(minutes, "min");

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return say(hours, "hour");

  const days = Math.floor(hours / 24);
  if (days < 7) return say(days, "day");
  if (days < 30) return say(Math.floor(days / 7), "week");
  if (days < 365) return say(Math.floor(days / 30), "month");
  return say(Math.floor(days / 365), "year");
}

/** «5d», «12h» - kutoh, dar pahlui nom. */
export function shortTimeAgo(iso?: string | null, lang: Lang = readLang()): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return AGO[lang].short;
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 365)}y`;
}

export function formatCount(n?: number | null): string {
  const value = n ?? 0;
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${trim(value / 1000)}K`;
  return `${trim(value / 1_000_000)}M`;
}

function trim(n: number) {
  return n.toFixed(1).replace(/\.0$/, "");
}

export function initials(name?: string | null): string {
  const clean = (name ?? "").trim();
  if (!clean) return "?";
  return (
    clean
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
