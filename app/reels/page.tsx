"use client";

// ============================================================
//  app/reels/page.tsx  ->  adres: /reels
//
//  In sahifa FAQAT reels (video) nishon medihad - digar hech chiz.
//  Lentai amudi: yak video = yak ekran (scroll-snap),
//  monandi instagram Reels.
//
//  Se namudi lenta:
//    HAMA        -> GET /Reels/get-reels
//    PODPISKAHO  -> GET /Reels/get-following-reels
//    SAQLSHUDA   -> GET /Reels/get-reels-favorites
//
//  Holatho: loading / guest / error / ready
// ============================================================
import { useRef, useState } from "react";
import Link from "next/link";
import { Film, LockKeyhole, TriangleAlert } from "lucide-react";

import { type Reel } from "./api";
import { useReels, type Feed } from "./providers";
import styles from "./reels.module.css";

import ReelCard from "./components/ReelCard";
import CommentsSheet from "./components/CommentsSheet";
import { useT } from "@/components/LocaleProvider";

export default function ReelsPage() {
  const {
    status,
    error,
    reload,
    reels,
    feed,
    changeFeed,
    loadMore,
    loadingMore,
    hasMore,
  } = useReels();

  const { t } = useT();

  const tabs: { key: Feed; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "following", label: t.filterFollowing },
    { key: "saved", label: t.filterSaved },
  ];

  const [openComments, setOpenComments] = useState<Reel | null>(null);
  const feedBox = useRef<HTMLDivElement>(null);

  // Vaqte ba akhiri lenta nazdik shudem - sahifai navbatro megirem
  function handleScroll() {
    const box = feedBox.current;
    if (box === null || loadingMore || !hasMore) return;

    const left = box.scrollHeight - box.scrollTop - box.clientHeight;
    if (left < box.clientHeight * 1.5) loadMore();
  }

  // ---------- Token nest ----------
  if (status === "guest") {
    return (
      <Center>
        <span
          className={`${styles.gradBg} flex h-14 w-14 items-center justify-center rounded-2xl`}
        >
          <LockKeyhole className="h-6 w-6" strokeWidth={1.8} />
        </span>

        <h1 className="text-2xl font-bold tracking-tight">{t.loginFirst}</h1>

        <p
          className="max-w-sm text-sm leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          {t.reelsGuestText}
        </p>

        <Link
          href="/Auth/login"
          className={`${styles.gradBg} rounded-full px-6 py-3 text-sm font-semibold`}
        >
          {t.signIn}
        </Link>
      </Center>
    );
  }

  // ---------- Khatoi server ----------
  if (status === "error") {
    return (
      <Center>
        <span
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[13px]"
          style={{ background: "var(--panel)", color: "var(--signal)" }}
        >
          <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          {error}
        </span>

        <button
          type="button"
          onClick={() => reload()}
          className="rounded-full px-6 py-3 text-sm font-semibold"
          style={{ background: "var(--panel)", color: "var(--fg)" }}
        >
          {t.retry}
        </button>
      </Center>
    );
  }

  return (
    <div className="relative h-full">
      {/* ---------- Tabho (bar boloi lenta) ---------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center p-3">
        <div className={`${styles.tabs} pointer-events-auto`}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => changeFeed(tab.key)}
              className={`${styles.tab} ${
                feed === tab.key ? styles.tabActive : ""
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- LENTA ---------- */}
      {status === "loading" ? (
        <LoadingView />
      ) : reels.length === 0 ? (
        <Center>
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full border-2"
            style={{ borderColor: "var(--fg)" }}
          >
            <Film className="h-7 w-7" strokeWidth={1.5} />
          </span>

          <h2 className="text-xl font-bold tracking-tight">{t.noVideo}</h2>

          <p
            className="max-w-xs text-sm leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            {feed === "following"
              ? t.reelsEmptyFollowing
              : feed === "saved"
                ? t.reelsEmptySaved
                : t.reelsEmptyAll}
          </p>
        </Center>
      ) : (
        <div ref={feedBox} className={styles.feed} onScroll={handleScroll}>
          {reels.map((reel) => (
            <ReelCard
              key={reel.reelsId}
              reel={reel}
              onOpenComments={setOpenComments}
            />
          ))}

          {loadingMore && (
            <div className="flex items-center justify-center py-6">
              <span className={styles.blocks} style={{ color: "var(--muted)" }}>
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
        </div>
      )}

      {/* ---------- Kommentho ---------- */}
      <CommentsSheet
        reel={openComments}
        onClose={() => setOpenComments(null)}
      />
    </div>
  );
}

// ------------------------------------------------------------
function Center({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${styles.rise} flex h-full flex-col items-center justify-center gap-5 px-8 text-center`}
    >
      {children}
    </div>
  );
}

function LoadingView() {
  return (
    <div className="flex h-full items-center justify-center p-3">
      <div
        className={styles.skeleton}
        style={{ height: "100%", aspectRatio: "9 / 16", maxWidth: "100%" }}
      />
    </div>
  );
}
