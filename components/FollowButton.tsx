"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useT } from "./LocaleProvider";

/** Кнопка Follow/Following с оптимистичным обновлением. */
export function FollowButton({
  userId,
  initialFollowing,
  variant = "link",
}: {
  userId: string;
  initialFollowing: boolean;
  variant?: "link" | "solid";
}) {
  const { t } = useT();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    const next = !following;
    setBusy(true);
    setFollowing(next);
    try {
      if (next) await api.follow(userId);
      else await api.unfollow(userId);
    } catch {
      setFollowing(!next);
    } finally {
      setBusy(false);
    }
  };

  if (variant === "solid") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`rounded-lg px-4 py-1.5 text-[14px] font-semibold transition-all duration-200 active:scale-95 disabled:opacity-60 ${
          following
            ? "bg-[var(--hover)] text-[var(--foreground)] hover:bg-[var(--border)]"
            : "bg-[var(--sb-accent)] text-white shadow-[0_4px_14px_-4px_rgba(0,149,246,0.7)] hover:bg-[#1877f2] hover:shadow-[0_6px_18px_-4px_rgba(0,149,246,0.8)]"
        }`}
      >
        {following ? t.following : t.follow}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="text-[12px] font-semibold text-[var(--sb-accent)] transition-all duration-200 hover:text-[#00376b] active:scale-95 disabled:opacity-60"
    >
      {following ? t.following : t.follow}
    </button>
  );
}
