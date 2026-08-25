function plural(value: number, unit: string) {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

/** «1 hour ago» — как в подписи под комментарием. */
export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return plural(seconds, "second");

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return plural(minutes, "minute");

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, "hour");

  const days = Math.floor(hours / 24);
  if (days < 7) return plural(days, "day");
  if (days < 30) return plural(Math.floor(days / 7), "week");
  if (days < 365) return plural(Math.floor(days / 30), "month");
  return plural(Math.floor(days / 365), "year");
}

/** «5d», «12h» — компактная подпись рядом с ником. */
export function shortTimeAgo(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return "now";
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
