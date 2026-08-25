"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Post } from "@/lib/types";
import { PostGrid } from "@/components/PostGrid";
import { BookmarkIcon } from "@/components/icons";

export default function SavedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .favorites({ page: 1, pageSize: 30 })
      .then((response) => {
        if (alive) setPosts(response.data ?? []);
      })
      .catch(() => {
        if (alive) setPosts([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[935px] px-4 py-6">
      <h1 className="animate-fade-up mb-5 text-[22px] font-bold">Saved</h1>

      {loading && (
        <div className="grid grid-cols-3 gap-1 md:gap-[3px]">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="skeleton aspect-square rounded-md" />
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="animate-fade-up flex flex-col items-center gap-3 py-16 text-center text-[var(--muted)]">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#eff6ff,#f0fdfa)] text-[#38bdf8]">
            <BookmarkIcon size={40} />
          </span>
          <p className="text-[14px]">Сохранённых постов пока нет.</p>
        </div>
      )}

      {posts.length > 0 && <PostGrid posts={posts} />}
    </div>
  );
}
