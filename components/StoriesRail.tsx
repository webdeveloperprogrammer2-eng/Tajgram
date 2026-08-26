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

  // Hamsoyaho: dar instagram (PK) chap va rost korti khurdshuda
  // meistad. Ba on zer kuni - ba hamon story meguzarad.
  const before = index > 0 ? groups[index - 1] : null;
  const after = index < groups.length - 1 ? groups[index + 1] : null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#1a1a1a]"
      onClick={onClose}
    >
      {/* Logo dar kunji chap-bolo - monandi instagram */}
      <span className="pointer-events-none absolute left-6 top-5 z-20 select-none font-logo text-[26px] leading-none text-white">
        Tajgram
      </span>

      <button
        type="button"
        onClick={onClose}
        aria-label={t.closeStory}
        className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full text-[20px] leading-none text-white transition hover:bg-white/10"
      >
        ✕
      </button>

      {/* ---- Hamsoyai CHAP ---- */}
      {before !== null && (
        <StoryPeek
          group={before}
          side="left"
          onClick={() => onChangeIndex(index - 1)}
        />
      )}

      {/* ---- Hamsoyai ROST ---- */}
      {after !== null && (
        <StoryPeek
          group={after}
          side="right"
          onClick={() => onChangeIndex(index + 1)}
        />
      )}

      {/* ---- Tirchahoi gird (berun az kort, monandi instagram) ---- */}
      {index > 0 && (
        <button
          type="button"
          aria-label={t.prevStory}
          onClick={(event) => {
            event.stopPropagation();
            onChangeIndex(index - 1);
          }}
          className="absolute left-[calc(50%-min(28vh,220px)-56px)] top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[20px] leading-none text-[#262626] shadow-md transition hover:scale-110 active:scale-95"
        >
          ‹
        </button>
      )}
      {index < groups.length - 1 && (
        <button
          type="button"
          aria-label={t.nextStory}
          onClick={(event) => {
            event.stopPropagation();
            onChangeIndex(index + 1);
          }}
          className="absolute right-[calc(50%-min(28vh,220px)-56px)] top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[20px] leading-none text-[#262626] shadow-md transition hover:scale-110 active:scale-95"
        >
          ›
        </button>
      )}

      {/* ---- KORTI ASOSI ---- */}
      <div
        className="animate-scale-in relative flex aspect-[9/16] h-[calc(100vh-90px)] max-h-[860px] flex-col overflow-hidden rounded-[6px] bg-black shadow-[0_10px_60px_rgba(0,0,0,0.5)]"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {/* Media. Suratho gohe pahn hastand (screenshot) - dar pusht
            hamon surat kalonkarda va khira meistad, to navorhoi siyohi
            murda namonand. Aynan hamon tavr ki instagram mekunad. */}
        <div className="absolute inset-0">
          {src && video ? (
            <>
              <video
                key={src + "-bg"}
                src={src}
                aria-hidden
                muted
                playsInline
                className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-3xl"
              />
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
                className="relative h-full w-full object-contain"
              />
            </>
          ) : src ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={src + "-bg"}
                src={src}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-3xl"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={src}
                src={src}
                alt={t.story}
                className="relative h-full w-full object-contain"
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-[13px] text-white/50">
              {t.storyUnavailable}
            </div>
          )}
        </div>

        {/* Tira kardani boloi kort - to sarlavha dar har surat khonda shavad */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 via-black/25 to-transparent" />

        {/* Khathoi progress */}
        <div className="relative z-10 flex gap-[3px] px-2 pt-3">
          {group.items.map((item, i) => (
            <span
              key={item.id}
              className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/35"
            >
              <span
                className="block h-full rounded-full bg-white"
                style={{
                  width: i < step ? "100%" : i === step ? `${progress * 100}%` : "0%",
                }}
              />
            </span>
          ))}
        </div>

        {/* Sarlavha: avatar, nom, vaqt */}
        <div className="relative z-10 flex items-center gap-3 px-3 py-3">
          <Link
            href={`/profile/${group.userId}`}
            className="flex min-w-0 items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <Avatar src={group.avatar} name={group.userName} size={32} />
            <span className="truncate text-[14px] font-semibold text-white">
              {group.userName}
            </span>
          </Link>
          <span className="shrink-0 text-[14px] text-white/70">
            {shortTimeAgo(story?.createAt)}
          </span>
        </div>

        {/* Zonahoi guzarish: chap 1/3, rost 2/3 */}
        <button
          type="button"
          onClick={prev}
          aria-label={t.prevStory}
          className="absolute bottom-0 left-0 top-16 w-1/3"
        />
        <button
          type="button"
          onClick={next}
          aria-label={t.nextStory}
          className="absolute bottom-0 right-0 top-16 w-2/3"
        />
      </div>
    </div>
  );
}

// Korti khurdi hamsoya (chap yo rost) - monandi instagram dar PK.
// Dar telefon nishon doda NAMESHAVAD (md:block).
function StoryPeek({
  group,
  side,
  onClick,
}: {
  group: StoryGroup;
  side: "left" | "right";
  onClick: () => void;
}) {
  const first = group.items[0] ?? null;
  const cover = mediaUrl(first?.fileName);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      style={{ [side]: "calc(50% + min(28vh, 220px) + 28px)" }}
      className="absolute top-1/2 hidden aspect-[9/16] h-[52vh] max-h-[480px] -translate-y-1/2 overflow-hidden rounded-[6px] bg-[#262626] opacity-60 transition-opacity duration-200 hover:opacity-90 md:block"
    >
      {cover !== null && !isVideo(first?.fileName) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" aria-hidden className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          <Avatar src={group.avatar} name={group.userName} size={56} />
        </span>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-left text-[13px] font-semibold text-white">
        {group.userName}
      </span>
    </button>
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
