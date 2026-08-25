"use client";

import { isVideo } from "@/lib/api";
import { formatCount } from "@/lib/format";
import type { Post } from "@/lib/types";
import { PostMedia } from "./PostMedia";
import { CommentIcon, HeartIcon, ImageIcon, PlayIcon } from "./icons";

/**
 * Сетка постов 3×N — профиль и сохранённое.
 * Har kafcha: nishonai video/albom dar kunc, va hangomi
 * guzoshtani mush - parda bo omor va "zoom"-i narm.
 */
export function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {posts.map((post, index) => {
        const video = isVideo(post.images?.[0]?.imageName);
        const album = (post.images?.length ?? 0) > 1;

        return (
          <div
            key={post.postId}
            style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
            className="group/media animate-scale-in relative aspect-square overflow-hidden rounded-lg bg-[var(--panelSoft)] transition-[transform,box-shadow] duration-300 ease-out hover:z-10 hover:-translate-y-1 hover:shadow-[var(--shadow)] md:rounded-xl"
          >
            <PostMedia
              fileName={post.images?.[0]?.imageName ?? null}
              alt={post.title ?? "post"}
              zoom
            />

            {/* Nishona: video yo albom */}
            {(video || album) && (
              <span className="pointer-events-none absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white opacity-90 backdrop-blur-sm transition-opacity duration-300 group-hover/media:opacity-0">
                {video ? <PlayIcon size={12} /> : <ImageIcon size={12} />}
              </span>
            )}

            {/* Pardai omor */}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-4 bg-[linear-gradient(to_top,rgba(0,0,0,0.65),rgba(0,0,0,0.25))] text-[13px] font-bold text-white opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover/media:opacity-100 sm:gap-6 sm:text-[15px]">
              <span className="flex translate-y-2 items-center gap-1.5 transition-transform duration-300 group-hover/media:translate-y-0">
                <HeartIcon size={17} filled />
                {formatCount(post.postLikeCount)}
              </span>
              <span className="flex translate-y-2 items-center gap-1.5 transition-transform delay-[40ms] duration-300 group-hover/media:translate-y-0">
                <CommentIcon size={17} />
                {formatCount(post.commentCount)}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
