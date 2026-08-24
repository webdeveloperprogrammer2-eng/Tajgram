"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Story } from "@/lib/types";
import { Avatar } from "./Avatar";
import { useSession } from "./SessionProvider";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

type StoryGroup = {
  userId: string;
  userName: string;
  avatar: string | null;
  count: number;
};

/** Истории за 24 часа, сгруппированные по автору. */
export function StoriesRail() {
  const { me } = useSession();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const railRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ left: false, right: false });

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
    <div className="animate-fade-up relative mb-4 rounded-2xl border border-[#efefef] bg-white px-2 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
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
            <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#0095f6] text-[13px] leading-none text-white transition-transform duration-300 group-hover:scale-110">
              +
            </span>
          </span>
          <span className="w-full truncate text-center text-[12px] text-[#262626]">
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
          <Link
            key={story.userId}
            href={`/profile/${story.userId}`}
            style={{ animationDelay: `${index * 60}ms` }}
            className="animate-scale-in flex w-[74px] shrink-0 flex-col items-center gap-1.5"
          >
            <Avatar src={story.avatar} name={story.userName} size={56} ring="gradient" />
            <span className="w-full truncate text-center text-[12px] text-[#262626]">
              {story.userName}
            </span>
          </Link>
        ))}

        {!loading && groups.length === 0 && (
          <div className="flex items-center px-3 text-[13px] text-[#8e8e8e]">
            No new stories in the last 24 hours.
          </div>
        )}
      </div>

      {scroll.left && (
        <button
          type="button"
          onClick={() => slide(-1)}
          aria-label="Scroll stories left"
          className="animate-fade-in absolute left-1 top-[44px] flex h-[28px] w-[28px] items-center justify-center rounded-full bg-white text-[#262626] shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <ChevronLeftIcon size={14} />
        </button>
      )}
      {scroll.right && (
        <button
          type="button"
          onClick={() => slide(1)}
          aria-label="Scroll stories right"
          className="animate-fade-in absolute right-1 top-[44px] flex h-[28px] w-[28px] items-center justify-center rounded-full bg-white text-[#262626] shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <ChevronRightIcon size={14} />
        </button>
      )}
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
      continue;
    }

    map.set(userId, {
      userId,
      userName: story.viewerDto?.userName ?? story.viewerDto?.name ?? "story",
      avatar: story.userAvatar,
      count: 1,
    });
  }

  return [...map.values()];
}
