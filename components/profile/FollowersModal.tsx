"use client";

// ============================================================
//  FollowersModal - ro-ykhati OBUNACHIHO yo OBUNAHO,
//  monandi instagram: oynai borik, justuju dar bolo,
//  har satr [avatar] [nom] [tugma].
//
//  GET /FollowingRelationShip/get-subscribers   -> obunachiho
//  GET /FollowingRelationShip/get-subscriptions -> obunaho
//
//  Peshtar in ro-ykhat FAQAT dar /profile (profili khud) bud,
//  va dar profili korbari DIGAR raqamho umuman zada nameshudand.
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import { api } from "@/lib/api";
import type { ProfileUser } from "@/lib/types";

import { Avatar } from "../Avatar";
import { CloseIcon, SearchIcon } from "../icons";
import { ProfileButton } from "./ProfileTop";
import { useT } from "@/components/LocaleProvider";

export type FollowTab = "followers" | "following";

export function FollowersModal({
  tab,
  userId,
  myUserId,
  onClose,
}: {
  tab: FollowTab | null;
  /** Profili KI-ro meboinem. */
  userId: string;
  /** KI man hastam - ba KHUDAM tugmai "Obuna" lozim nest. */
  myUserId: string;
  onClose: () => void;
}) {
  const { t } = useT();
  const [list, setList] = useState<ProfileUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState("");

  const load = useCallback(async (which: FollowTab, id: string) => {
    setLoading(true);
    setError("");
    setQuery("");

    try {
      const response =
        which === "followers"
          ? await api.followers(id)
          : await api.followings(id);

      setList(response.data ?? []);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t.listLoadFailed,
      );
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [t.listLoadFailed]);

  useEffect(() => {
    if (tab === null) return;

    queueMicrotask(() => void load(tab, userId));
  }, [tab, userId, load]);

  // Esc mebandad + scroll-i sahifa dar zeri oyna band meshavad
  useEffect(() => {
    if (tab === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
    };
  }, [tab, onClose]);

  async function toggleFollow(user: ProfileUser) {
    if (pending !== "") return;

    setPending(user.userId);

    // Darhol ivaz mekunem - monandi instagram
    setList((old) =>
      old.map((item) =>
        item.userId === user.userId
          ? { ...item, isFollowing: !item.isFollowing }
          : item,
      ),
    );

    try {
      if (user.isFollowing) await api.unfollow(user.userId);
      else await api.follow(user.userId);
    } catch {
      // Nashud -> ba aqib
      setList((old) =>
        old.map((item) =>
          item.userId === user.userId
            ? { ...item, isFollowing: user.isFollowing }
            : item,
        ),
      );
    } finally {
      setPending("");
    }
  }

  if (tab === null) return null;

  const clean = query.trim().toLowerCase();
  const shown =
    clean === ""
      ? list
      : list.filter(
          (user) =>
            user.userName.toLowerCase().includes(clean) ||
            user.fullName.toLowerCase().includes(clean),
        );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="animate-scale-in flex max-h-[min(400px,90dvh)] w-full max-w-[400px] flex-col overflow-hidden rounded-xl border bg-[var(--bg)]"
        style={{ borderColor: "var(--line)" }}
      >
        {/* ---------- Sarlavha ---------- */}
        <header
          className="relative flex h-11 shrink-0 items-center justify-center border-b"
          style={{ borderColor: "var(--line)" }}
        >
          <h2 className="text-[16px] font-semibold">
            {tab === "followers" ? t.titleFollowers : t.titleFollowing}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 hover:bg-[var(--panel)]"
          >
            <CloseIcon size={20} />
          </button>
        </header>

        {/* ---------- Justuju ---------- */}
        <div className="shrink-0 px-4 py-2">
          <label className="flex items-center gap-2 rounded-lg bg-[var(--panel)] px-3 py-1.5">
            <SearchIcon size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.search}
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-[var(--muted)]"
            />
          </label>
        </div>

        {/* ---------- Ro-ykhat ---------- */}
        <div className="flex-1 overflow-y-auto">
          {loading &&
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2">
                <div className="skeleton h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton h-3 w-32 rounded" />
                </div>
              </div>
            ))}

          {!loading && error !== "" && (
            <p
              className="px-4 py-10 text-center text-[14px]"
              style={{ color: "var(--danger)" }}
            >
              {error}
            </p>
          )}

          {!loading && error === "" && shown.length === 0 && (
            <p
              className="px-4 py-10 text-center text-[14px]"
              style={{ color: "var(--muted)" }}
            >
              {clean === "" ? t.nobodyYet : t.notFoundShort}
            </p>
          )}

          {!loading &&
            shown.map((user) => (
              <div key={user.userId} className="flex items-center gap-3 px-4 py-2">
                <Link href={`/profile/${user.userId}`} onClick={onClose}>
                  <Avatar src={user.image} name={user.fullName} size={44} />
                </Link>

                <Link
                  href={`/profile/${user.userId}`}
                  onClick={onClose}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-[14px] font-semibold">
                    {user.userName}
                  </p>
                  <p className="truncate text-[14px] text-[var(--muted)]">
                    {user.fullName}
                  </p>
                </Link>

                {/* Ba KHUDAM tugmai obuna lozim nest */}
                {user.userId !== myUserId && (
                  <ProfileButton
                    onClick={() => toggleFollow(user)}
                    disabled={pending === user.userId}
                    primary={!user.isFollowing}
                  >
                    {user.isFollowing ? t.unfollowShort : t.followShort}
                  </ProfileButton>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
