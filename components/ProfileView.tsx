"use client";

// ============================================================
//  ProfileView - profili korbari DIGAR (/profile/[userId]).
//
//  Sokhtor ayni monandi profili khud:
//    yak KARTAI yaklukht -> dar bolo MUQOVA (surat mavhum +
//    doghhoi rangin), dar poyon avatar, nom, omor va tabho.
//  Muqova DARUNI karta ast - hech goh kaj nameshavad.
//
//  TUGMA faqat YAKTOST: Follow (yo Tahrir, agar profili khud).
// ============================================================

import { useMemo, useState } from "react";
import Link from "next/link";
import { isVideo, mediaUrl } from "@/lib/api";
import type { Post, UserProfile } from "@/lib/types";
import { Avatar } from "./Avatar";
import { CountUp } from "./CountUp";
import { FollowButton } from "./FollowButton";
import { PostGrid } from "./PostGrid";
import { HeartIcon, ImageIcon, PlayIcon } from "./icons";

type TabId = "posts" | "video" | "top";

const TABS: { id: TabId; label: string }[] = [
  { id: "posts", label: "Postho" },
  { id: "video", label: "Video" },
  { id: "top", label: "Mashhur" },
];

export function ProfileView({
  profile,
  isMe = false,
}: {
  profile: UserProfile;
  isMe?: boolean;
}) {
  const posts = useMemo(() => profile.posts ?? [], [profile.posts]);
  const [tab, setTab] = useState<TabId>("posts");

  const cover = mediaUrl(profile.image);
  const displayName = profile.fullName || profile.userName;

  // Har tab az HAMON ruykhat kor mekunad - ma`lumoti soxta nest
  const groups = useMemo(() => {
    const video = posts.filter((post) => isVideo(post.images?.[0]?.imageName));
    const top = [...posts]
      .filter((post) => (post.postLikeCount ?? 0) > 0)
      .sort((a, b) => (b.postLikeCount ?? 0) - (a.postLikeCount ?? 0));
    return { posts, video, top } as Record<TabId, Post[]>;
  }, [posts]);

  const active = groups[tab];
  const activeIndex = TABS.findIndex((item) => item.id === tab);

  return (
    <div className="mx-auto w-full max-w-[980px] px-3 pt-2 pb-10 sm:px-5 sm:pt-4">
      <section className="animate-fade-up overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--glass)] shadow-[var(--shadow)] backdrop-blur-2xl sm:rounded-[30px]">
        {/* ---------- MUQOVA ---------- */}
        <div
          aria-hidden
          className="pointer-events-none relative h-[168px] overflow-hidden sm:h-[210px]"
        >
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="absolute inset-0 h-full w-full scale-[1.3] object-cover opacity-50 blur-[58px] saturate-[1.7]"
            />
          )}
          <span className="animate-aurora absolute -top-[9rem] -left-[6rem] h-[25rem] w-[25rem] rounded-full bg-[radial-gradient(circle,var(--accentA),transparent_66%)] opacity-50 blur-[64px]" />
          <span className="animate-aurora-slow absolute -top-[12rem] -right-[5rem] h-[29rem] w-[29rem] rounded-full bg-[radial-gradient(circle,var(--accentB),transparent_66%)] opacity-45 blur-[64px]" />
          <span className="animate-float absolute -top-[5rem] left-[40%] h-[19rem] w-[19rem] rounded-full bg-[radial-gradient(circle,#29d0ff,transparent_70%)] opacity-25 blur-[64px]" />
          <span className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_18%,var(--bg))]" />
        </div>

        {/* ---------- MA'LUMOT ---------- */}
        <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-[62px] flex flex-col items-center gap-5 sm:-mt-[76px] sm:flex-row sm:items-end sm:gap-7">
            {/* Avatar bo halqai gardishkunanda */}
            <div className="relative shrink-0">
              <span className="ring-conic animate-ring-spin absolute -inset-[12px] rounded-full opacity-60 blur-[14px]" />
              <span className="ring-conic animate-ring-spin absolute -inset-[3px] rounded-full" />
              <span className="absolute inset-0 rounded-full bg-[var(--bg)]" />
              <Avatar
                src={profile.image}
                name={displayName}
                size={148}
                ring="none"
                className="relative hidden rounded-full border-[3px] border-[var(--bg)] sm:inline-flex"
              />
              <Avatar
                src={profile.image}
                name={displayName}
                size={124}
                ring="none"
                className="relative rounded-full border-[3px] border-[var(--bg)] sm:hidden"
              />
            </div>

            <div className="min-w-0 flex-1 pb-1 text-center sm:pb-2 sm:text-left">
              <h1 className="truncate text-[26px] leading-tight font-bold tracking-[-0.02em] sm:text-[32px]">
                {displayName}
              </h1>
              <p className="mt-0.5 truncate text-[14px] font-medium text-[var(--muted)]">
                @{profile.userName}
              </p>
            </div>

            {/* Yagona tugma */}
            <div className="shrink-0 pb-1 sm:pb-2">
              {isMe ? (
                <Link
                  href="/settings"
                  className="inline-flex rounded-full bg-[linear-gradient(115deg,var(--accentA),var(--accentB))] px-6 py-2.5 text-[14px] font-semibold text-white shadow-[0_12px_30px_-12px_var(--accentA)] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
                >
                  Tahrir
                </Link>
              ) : (
                <FollowButton
                  userId={profile.userId}
                  initialFollowing={profile.isFollowing}
                  variant="solid"
                />
              )}
            </div>
          </div>

          {profile.about && (
            <p className="mx-auto mt-5 max-w-[58ch] text-center text-[14px] leading-relaxed whitespace-pre-line sm:mx-0 sm:text-left">
              {profile.about}
            </p>
          )}

          {/* ---------- OMOR ---------- */}
          <ul className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { value: profile.postCount, label: "Postho" },
              { value: profile.subscribersCount, label: "Folowers" },
              { value: profile.subscriptionsCount, label: "Folowing" },
            ].map((stat, index) => (
              <li
                key={stat.label}
                className="rounded-[20px] border border-[var(--line)] bg-[var(--panelSoft)] px-2 py-3.5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[var(--lineStrong)] hover:shadow-[var(--shadowSoft)] sm:px-4"
              >
                <div className="text-gradient text-[22px] font-extrabold tracking-[-0.02em] tabular-nums sm:text-[26px]">
                  <CountUp value={stat.value} delay={200 + index * 90} />
                </div>
                <div className="mt-0.5 text-[11px] font-medium tracking-wide text-[var(--muted)] uppercase sm:text-[12px]">
                  {stat.label}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- TABHO bo nishondihandai lagzanda ---------- */}
      <nav className="mt-6 border-b border-[var(--line)]">
        <div className="relative flex">
          {TABS.map((item) => {
            const on = item.id === tab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-[11px] font-semibold tracking-[0.09em] uppercase transition-colors duration-200 sm:text-[12px] ${
                  on ? "text-[var(--fg)]" : "text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                {item.id === "posts" && <ImageIcon size={15} />}
                {item.id === "video" && <PlayIcon size={15} />}
                {item.id === "top" && <HeartIcon size={15} filled={on} />}
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Khatti zerin ki az yak tab ba digare melaghzad */}
          <span
            className="absolute -bottom-px h-[2px] rounded-full bg-[linear-gradient(90deg,var(--accentA),var(--accentB))] transition-transform duration-300 ease-out"
            style={{
              width: `${100 / TABS.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        </div>
      </nav>

      {/* ---------- MAZMUN ---------- */}
      <div key={tab} className="animate-fade-in mt-4">
        {active.length > 0 ? (
          <PostGrid posts={active} />
        ) : (
          <EmptyState tab={tab} isMe={isMe} />
        )}
      </div>
    </div>
  );
}

/** Holati kholi - ba coi matni khushk yak korti zebo. */
function EmptyState({ tab, isMe }: { tab: TabId; isMe: boolean }) {
  const text: Record<TabId, string> = {
    posts: isMe ? "Hanuz post nakardaed" : "Hanuz post nest",
    video: "Hanuz video nest",
    top: "Hanuz posti lakdor nest",
  };

  return (
    <div className="animate-fade-up flex flex-col items-center gap-4 rounded-[26px] border border-dashed border-[var(--lineStrong)] py-16 text-center">
      <span className="animate-float relative flex h-24 w-24 items-center justify-center rounded-full bg-[var(--panelSoft)] text-[var(--muted)]">
        <span className="absolute inset-0 rounded-full bg-[linear-gradient(115deg,var(--accentA),var(--accentB))] opacity-15 blur-md" />
        <ImageIcon size={40} className="relative" />
      </span>
      <p className="text-[15px] font-semibold">{text[tab]}</p>
    </div>
  );
}
