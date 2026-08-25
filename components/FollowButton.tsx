"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

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
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  // Profil az server dertar meoyad - to on vaqt initialFollowing
  // "false" ast. Bе in useEffect tugma dar holati kuhna memonad.
  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  const toggle = async () => {
    if (busy || !userId) return;
    const next = !following;
    setBusy(true);
    setFailed(null);
    setFollowing(next);
    try {
      if (next) await api.follow(userId);
      else await api.unfollow(userId);
    } catch (cause: unknown) {
      // Peshtar khato KHOMUSH furu burda meshud va tugma faqat
      // ba aqib meparid - kas namefahmid, chi shud.
      setFollowing(!next);
      setFailed(cause instanceof Error ? cause.message : "Хатогӣ");
    } finally {
      setBusy(false);
    }
  };

  if (variant === "solid") {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={`rounded-lg px-4 py-1.5 text-[14px] font-semibold transition-all duration-200 active:scale-95 disabled:opacity-60 ${
            following
              ? "bg-[var(--line)] text-[var(--fg)] hover:bg-[var(--line)]"
              : "bg-[var(--accentA)] text-white shadow-[0_4px_14px_-4px_rgba(0,149,246,0.7)] hover:bg-[#1877f2] hover:shadow-[0_6px_18px_-4px_rgba(0,149,246,0.8)]"
          }`}
        >
          {following ? "Following" : "Follow"}
        </button>
        {failed && <span className="text-[11px] text-[#ed4956]">{failed}</span>}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="text-[12px] font-semibold text-[var(--accentA)] transition-all duration-200 hover:text-[#00376b] active:scale-95 disabled:opacity-60"
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
