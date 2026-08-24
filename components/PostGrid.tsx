"use client";

import { formatCount } from "@/lib/format";
import type { Post } from "@/lib/types";
import { PostMedia } from "./PostMedia";
import { CommentIcon, HeartIcon } from "./icons";

/** Сетка постов 3×N — профиль и сохранённое. */
export function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-[3px]">
      {posts.map((post, index) => (
        <div
          key={post.postId}
          style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
          className="group/media animate-scale-in relative aspect-square overflow-hidden rounded-md bg-[#fafafa]"
        >
          <PostMedia
            fileName={post.images?.[0]?.imageName ?? null}
            alt={post.title ?? "post"}
            zoom
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-5 bg-black/35 text-[14px] font-semibold text-white opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover/media:opacity-100">
            <span className="flex items-center gap-1.5">
              <HeartIcon size={18} filled />
              {formatCount(post.postLikeCount)}
            </span>
            <span className="flex items-center gap-1.5">
              <CommentIcon size={18} />
              {formatCount(post.commentCount)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
