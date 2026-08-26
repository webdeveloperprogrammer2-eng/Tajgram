"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, isVideo, mediaUrl } from "@/lib/api";
import { shortTimeAgo } from "@/lib/format";
import type { Story } from "@/lib/types";
import { Avatar } from "./Avatar";
import { useSession } from "./SessionProvider";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { useT } from "./LocaleProvider";

/** Сколько держится фото. У видео время своё. */
const PHOTO_MS = 5000;

type StoryGroup = {
  userId: string;
  userName: string;
  avatar: string | null;
  count: number;
  items: Story[];
};

/** Истории за 24 часа, сгруппированные по автору. */
export function StoriesRail() {
  const { t } = useT();
  const { me } = useSession();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const railRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ left: false, right: false });
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .stories()
      .then((response) => {
        if (!alive) return;
        setGroups(group(response.data ?? []));
      })
      .catch(() => {
        if (alive) setGroups([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const syncArrows = () => {
    const node = railRef.current;
    if (!node) return;
    setScroll({
      left: node.scrollLeft > 8,
      right: node.scrollLeft + node.clientWidth < node.scrollWidth - 8,
    });
  };

  useEffect(syncArrows, [groups]);

  const slide = (direction: 1 | -1) => {
    railRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  };

  return (
    <div className="animate-fade-up relative mb-4 rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-2 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div
        ref={railRef}
        onScroll={syncArrows}
        className="flex gap-4 overflow-x-auto scroll-smooth px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Link
          href="/create"
          className="group flex w-[74px] shrink-0 flex-col items-center gap-1.5"
        >
          <span className="relative">
            <Avatar
              src={me?.image}
              name={me?.fullName ?? me?.userName}
              size={56}
              ring="muted"
            />
            <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[var(--accentA)] text-[13px] leading-none text-white transition-transform duration-300 group-hover:scale-110">
              +
            </span>
          </span>
          <span className="w-full truncate text-center text-[12px] text-[var(--fg)]">
            your story
          </span>
        </Link>

        {loading &&
          Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="flex w-[74px] shrink-0 flex-col items-center gap-1.5"
            >
              <div className="skeleton h-[62px] w-[62px] rounded-full" />
              <div className="skeleton h-2.5 w-12 rounded" />
            </div>
          ))}

        {groups.map((story, index) => (
          <button
            key={story.userId}
            type="button"
            onClick={() => setActive(index)}
            style={{ animationDelay: `${index * 60}ms` }}
            className="animate-scale-in flex w-[74px] shrink-0 flex-col items-center gap-1.5"
          >
            <Avatar src={story.avatar} name={story.userName} size={56} ring="gradient" />
            <span className="w-full truncate text-center text-[12px] text-[var(--fg)]">
              {story.userName}
            </span>
          </button>
        ))}

        {!loading && groups.length === 0 && (
          <div className="flex items-center px-3 text-[13px] text-[var(--muted)]">
            {t.noStories}
          </div>
        )}
      </div>

      {scroll.left && (
        <button
          type="button"
          onClick={() => slide(-1)}
          aria-label={t.scrollLeft}
          className="animate-fade-in absolute left-1 top-[44px] flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[var(--bg)] text-[var(--fg)] shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <ChevronLeftIcon size={14} />
        </button>
      )}
      {scroll.right && (
        <button
          type="button"
          onClick={() => slide(1)}
          aria-label={t.scrollRight}
          className="animate-fade-in absolute right-1 top-[44px] flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[var(--bg)] text-[var(--fg)] shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <ChevronRightIcon size={14} />
        </button>
      )}

      {active !== null && groups[active] && (
        <StoryViewer
          groups={groups}
          index={active}
          onChangeIndex={setActive}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}

/**
 * Полноэкранный просмотр историй.
 * Фото держится PHOTO_MS, видео — свою длительность; дальше переход сам.
 */
function StoryViewer({
  groups,
  index,
  onChangeIndex,
  onClose,
}: {
  groups: StoryGroup[];
  index: number;
  onChangeIndex: (next: number) => void;
  onClose: () => void;
}) {
  const { t } = useT();
  const group = groups[index];
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const elapsed = useRef(0);

  const story = group.items[step] ?? null;
  const src = mediaUrl(story?.fileName);
  const video = isVideo(story?.fileName);

  const next = useCallback(() => {
    setProgress(0);
    elapsed.current = 0;
    if (step < group.items.length - 1) setStep(step + 1);
    else if (index < groups.length - 1) onChangeIndex(index + 1);
    else onClose();
  }, [step, index, group.items.length, groups.length, onChangeIndex, onClose]);

  const prev = useCallback(() => {
    setProgress(0);
    elapsed.current = 0;
    if (step > 0) setStep(step - 1);
    else if (index > 0) onChangeIndex(index - 1);
  }, [step, index, onChangeIndex]);

  // Новый автор — начинаем с его первой истории.
  useEffect(() => {
    elapsed.current = 0;
    queueMicrotask(() => {
      setStep(0);
      setProgress(0);
    });
  }, [index]);

  // Таймер для фото. У видео время своё — там onTimeUpdate.
  useEffect(() => {
    if (video || paused || story === null) return;

    // После паузы продолжаем с того же места, а не с нуля.
    const startedAt = Date.now() - elapsed.current;
    let frame = 0;

    const tick = () => {
      elapsed.current = Date.now() - startedAt;
      const value = Math.min(1, elapsed.current / PHOTO_MS);
      setProgress(value);
      if (value >= 1) next();
      else frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [video, paused, story, next]);

  // Пауза/продолжение видео вместе с общей паузой.
  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    if (paused) node.pause();
    else void node.play().catch(() => {});
  }, [paused, src]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [next, prev, onClose]);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      {/* Kort: hamon dizayni sahifai PROFIL - yak khel dar tamomi sayt */}
      <div
        className="animate-scale-in relative flex w-full max-w-[440px] flex-col overflow-hidden rounded-2xl bg-[#0f0f12] shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {/* ================= SAHNA ================= */}
        <div className="group relative flex min-h-[420px] w-full items-center justify-center overflow-hidden bg-black max-h-[min(86dvh,820px)]">
          {/* Pasazaminai khira - joi kholiro por mekunad */}
          {src !== null && !video && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-55 blur-3xl"
            />
          )}

          {src && video ? (
            <video
              key={src}
              ref={videoRef}
              src={src}
              autoPlay
              playsInline
              onTimeUpdate={(event) => {
                const node = event.currentTarget;
                if (node.duration > 0) setProgress(node.currentTime / node.duration);
              }}
              onEnded={next}
              className="relative max-h-[min(86dvh,820px)] w-full object-contain"
            />
          ) : src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={t.story}
              className="relative max-h-[min(86dvh,820px)] w-full object-contain"
            />
          ) : (
            <div className="flex h-[320px] items-center justify-center text-[13px] text-white/50">
              {t.storyUnavailable}
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/75 via-black/30 to-transparent" />

          {/* ---------- Bolo: navorho + korbar + bastan ---------- */}
          <div className="absolute inset-x-0 top-0 z-10 px-3 pt-3">
            <div className="flex gap-1.5">
              {group.items.map((item, i) => (
                <span
                  key={item.id}
                  className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/28"
                >
                  <span
                    className="block h-full rounded-full bg-white transition-[width] duration-75 ease-linear"
                    style={{
                      width:
                        i < step
                          ? "100%"
                          : i === step
                            ? `${Math.round(progress * 100)}%`
                            : "0%",
                    }}
                  />
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2.5">
              <Link
                href={`/profile/${group.userId}`}
                onClick={(event) => event.stopPropagation()}
                className="block shrink-0 rounded-full p-[2.5px] transition-transform duration-200 hover:scale-105"
                style={{
                  background:
                    "linear-gradient(45deg, #f9ce34, #ee2a7b 45%, #6228d7)",
                }}
              >
                <span className="block rounded-full border-2 border-[#0f0f12]">
                  <Avatar src={group.avatar} name={group.userName} size={32} />
                </span>
              </Link>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold uppercase tracking-[0.14em] text-white">
                  {group.userName}
                </p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">
                  {shortTimeAgo(story?.createAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={t.closeStory}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/45 text-[15px] leading-none text-white backdrop-blur transition-all duration-200 hover:bg-black/70 active:scale-95"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ---------- Guzarish: chap va rost ---------- */}
          <button
            type="button"
            onClick={prev}
            aria-label={t.prevStory}
            className="absolute bottom-0 left-0 top-20 w-1/3"
          />
          <button
            type="button"
            onClick={next}
            aria-label={t.nextStory}
            className="absolute bottom-0 right-0 top-20 w-2/3"
          />

          {/* Tugmahoi girdi chap/rost - faqat hangomi hover */}
          {(index > 0 || step > 0) && (
            <button
              type="button"
              onClick={prev}
              aria-label={t.prevStory}
              className="absolute left-2 top-1/2 z-10 flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-[18px] leading-none text-white opacity-0 backdrop-blur transition-opacity duration-200 hover:bg-black/75 focus-visible:opacity-100 group-hover:opacity-100"
            >
              ‹
            </button>
          )}
          {(index < groups.length - 1 || step < group.items.length - 1) && (
            <button
              type="button"
              onClick={next}
              aria-label={t.nextStory}
              className="absolute right-2 top-1/2 z-10 flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-[18px] leading-none text-white opacity-0 backdrop-blur transition-opacity duration-200 hover:bg-black/75 focus-visible:opacity-100 group-hover:opacity-100"
            >
              ›
            </button>
          )}
        </div>

        {/* ================= POYON: hisob ================= */}
        <div
          className="flex items-center justify-between gap-4 border-t px-4 py-3"
          style={{ borderColor: "rgba(255,255,255,0.10)" }}
        >
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/55">
            {step + 1} / {group.items.length}
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">
            {index + 1} / {groups.length}
          </span>
        </div>
      </div>
    </div>
  );
}

function group(stories: Story[]): StoryGroup[] {
  const map = new Map<string, StoryGroup>();

  for (const story of stories) {
    const userId = story.userId ?? "";
    if (!userId) continue;

    const existing = map.get(userId);
    if (existing) {
      existing.count += 1;
      existing.items.push(story);
      continue;
    }

    map.set(userId, {
      userId,
      userName: story.viewerDto?.userName ?? story.viewerDto?.name ?? "story",
      avatar: story.userAvatar,
      count: 1,
      items: [story],
    });
  }

  return [...map.values()];
}
