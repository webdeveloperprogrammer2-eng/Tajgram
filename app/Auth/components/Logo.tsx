"use client";

// ============================================================
//  Logo - wordmark.
//  Instagram camera icon + Instagram gradient "Tajgram" text.
// ============================================================
import { Instagram } from "lucide-react";
import styles from "../auth.module.css";

export default function Logo({ size = "small" }: { size?: "small" | "big" }) {
  const box = size === "big" ? "h-9 w-9 p-1.5" : "h-7 w-7 p-1";
  const iconSize = size === "big" ? "h-5 w-5" : "h-4 w-4";
  const textSize = size === "big" ? "text-xl" : "text-lg";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${styles.gradBg} ${box} flex shrink-0 items-center justify-center rounded-[10px] text-white shadow-sm`}
        aria-hidden
      >
        <Instagram className={iconSize} strokeWidth={2.2} />
      </div>

      <span className={`${styles.gradText} ${textSize} font-black tracking-tight select-none`}>
        Tajgram
      </span>
    </div>
  );
}
