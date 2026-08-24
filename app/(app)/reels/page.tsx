"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCount } from "@/lib/format";
import type { Reel } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { PostMedia } from "@/components/PostMedia";
import { CommentIcon, HeartIcon, ReelsIcon } from "@/components/icons";

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .reels({ page: 1, pageSize: 10 })
      .then((response) => {
        if (alive) setReels(response.data ?? []);
      })
      .catch(() => {
        if (alive) setReels([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[420px] px-2 py-6">
      <h1 className="animate-fade-up mb-4 px-2 text-[22px] font-bold">Reels</h1>

      {loading && (
        <div className="skeleton aspect-[9/16] w-full rounded-2xl" />
      )}

      {!loading && reels.length === 0 && (
        <div className="animate-fade-up flex flex-col items-center gap-3 py-16 text-center text-[#8e8e8e]">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f5f3ff,#ecfeff)] text-[#8b5cf6]">
            <ReelsIcon size={40} />
          </span>
          <p className="text-[14px]">Reels пока нет.</p>
        </div>
      )}

      <div className="space-y-4">
        {reels.map((reel, index) => (
          <article
            key={reel.reelsId}
            style={{ animationDelay: `${Math.min(index, 6) * 90}ms` }}
            className="animate-fade-up overflow-hidden rounded-2xl bg-black shadow-[0_10px_30px_-16px_rgba(0,0,0,0.5)]"
          >
            <div className="group/media relative aspect-[9/16] w-full">
              <PostMedia
                fileName={reel.videoName ?? reel.coverName}
                alt={reel.title ?? "reel"}
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgba(0,0,0,0.65))] p-3 text-white">
                <div className="pointer-events-auto flex items-center gap-2">
                  <Avatar src={reel.userImage} name={reel.userName} size={30} />
                  <Link
                    href={`/profile/${reel.userId}`}
                    className="text-[14px] font-semibold transition-opacity hover:opacity-80"
                  >
                    {reel.userName}
                  </Link>
                </div>
                {reel.description && (
                  <p className="mt-2 line-clamp-2 text-[13px]">{reel.description}</p>
                )}
                <div className="mt-2 flex items-center gap-4 text-[13px]">
                  <span className="flex items-center gap-1">
                    <HeartIcon size={18} filled={reel.reelsLike} />
                    {formatCount(reel.reelsLikeCount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <CommentIcon size={18} />
                    {formatCount(reel.commentCount)}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
