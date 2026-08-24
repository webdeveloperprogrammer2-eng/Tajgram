"use client";

import { useState } from "react";
import { mediaUrl } from "@/lib/api";
import { initials } from "@/lib/format";

type Ring = "none" | "gradient" | "muted";

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: number;
  ring?: Ring;
  className?: string;
  interactive?: boolean;
};

/**
 * Файл аватара может не существовать (диск бэкенда на Render не постоянный),
 * поэтому при ошибке загрузки показываем инициалы.
 */
export function Avatar({
  src,
  name,
  size = 32,
  ring = "none",
  className = "",
  interactive = true,
}: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const url = mediaUrl(src);
  const showImage = url && !broken;

  const inner = (
    <span
      className="relative flex items-center justify-center overflow-hidden rounded-full bg-[var(--hover)] text-[var(--muted)] select-none"
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.36) }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name ?? "avatar"}
          width={size}
          height={size}
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="font-semibold tracking-tight">{initials(name)}</span>
      )}
    </span>
  );

  const motion = interactive
    ? "transition-transform duration-300 ease-out hover:scale-[1.06] active:scale-95"
    : "";

  if (ring === "none") {
    return <span className={`inline-flex shrink-0 ${motion} ${className}`}>{inner}</span>;
  }

  return (
    <span
      className={`group/ring inline-flex shrink-0 items-center justify-center rounded-full p-[2px] ${
        ring === "gradient"
          ? "bg-[linear-gradient(45deg,#f9ce34,#ee2a7b_45%,#6228d7)] shadow-[0_0_0_0_rgba(238,42,123,0.35)] hover:shadow-[0_0_0_4px_rgba(238,42,123,0.12)]"
          : "bg-[var(--border)]"
      } transition-shadow duration-300 ${motion} ${className}`}
    >
      <span className="rounded-full bg-[var(--card)] p-[2px]">{inner}</span>
    </span>
  );
}
