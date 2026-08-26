"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Post } from "@/lib/types";
import type { Dict } from "./appLang";
import { PostCard } from "./PostCard";
import { useT } from "./LocaleProvider";
import { useSession } from "./SessionProvider";
import { useBlockedIds } from "@/lib/blocks";
import { StoriesRail } from "./StoriesRail";
import { CheckCircleIcon, ImageIcon } from "./icons";

const PAGE_SIZE = 5;

/**
 * Лента главной страницы: подписки сверху, затем «You're all caught up»
 * и рекомендованные посты (как на instagram.com).
 */
export function Feed() {
  const [following, setFollowing] = useState<Post[]>([]);
  const [suggested, setSuggested] = useState<Post[]>([]);
  const [followingDone, setFollowingDone] = useState(false);
  const [suggestedPage, setSuggestedPage] = useState(1);
  const [suggestedDone, setSuggestedDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ba KI man obuna hastam - baroi tugmai "Follow" dar
  // "Suggested Posts". Bе in, tugma hamesha "Follow" meguft.
  const { me } = useSession();
  const { t } = useT();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const blockedIds = useBlockedIds();

  const seen = useRef(new Set<number>());
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (me === null) return;

    let alive = true;

    api
      .followings(me.userId)
      .then((response) => {
        if (!alive) return;
        setFollowingIds(
          new Set((response.data ?? []).map((user) => user.userId)),
        );
      })
      .catch(() => {
        /* be in ro-ykhat ham lenta kor mekunad */
      });

    return () => {
      alive = false;
    };
  }, [me]);

  const remember = (posts: Post[]) => {
    const fresh = posts.filter((post) => !seen.current.has(post.postId));
    fresh.forEach((post) => seen.current.add(post.postId));
    return fresh;
  };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const feed = await api.followingPosts({ page: 1, pageSize: PAGE_SIZE });
        if (!alive) return;
        setFollowing(remember(feed.data ?? []));
        setFollowingDone((feed.totalPages ?? 1) <= 1);
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : "Не удалось загрузить ленту");
      }

      try {
        const explore = await api.posts({ page: 1, pageSize: PAGE_SIZE });
        if (!alive) return;
        setSuggested(remember(explore.data ?? []));
        setSuggestedDone((explore.totalPages ?? 1) <= 1);
      } catch {
        /* рекомендации не критичны для отрисовки ленты */
      }

      if (alive) setLoading(false);
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || suggestedDone) return;
    setLoadingMore(true);
    const next = suggestedPage + 1;
    try {
      const explore = await api.posts({ page: next, pageSize: PAGE_SIZE });
      const fresh = remember(explore.data ?? []);
      setSuggested((current) => [...current, ...fresh]);
      setSuggestedPage(next);
      if (!explore.data?.length || next >= (explore.totalPages ?? next)) {
        setSuggestedDone(true);
      }
    } catch {
      setSuggestedDone(true);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, suggestedDone, suggestedPage]);

  // Догрузка при прокрутке до конца списка.
  useEffect(() => {
    const node = sentinel.current;
    if (!node || suggestedDone) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "400px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, suggestedDone]);

  const loadMoreFollowing = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = Math.floor(following.length / PAGE_SIZE) + 1;
      const feed = await api.followingPosts({ page: nextPage, pageSize: PAGE_SIZE });
      const fresh = remember(feed.data ?? []);
      setFollowing((current) => [...current, ...fresh]);
      if (!fresh.length) setFollowingDone(true);
    } catch {
      setFollowingDone(true);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[630px]">
        <StoriesRail />
        {Array.from({ length: 2 }).map((_, index) => (
          <PostSkeleton key={index} index={index} />
        ))}
      </div>
    );
  }

  // Kasone ki MAN bastaam - posthoi onho dar lentai MAN
  // namoyon nameshavand. Baroi digaron hech chiz ivaz nashud.
  const visibleFollowing = following.filter(
    (post) => !blockedIds.has(post.userId),
  );
  const visibleSuggested = suggested.filter(
    (post) => !blockedIds.has(post.userId),
  );

  const nothingAtAll =
    visibleFollowing.length === 0 && visibleSuggested.length === 0;

  return (
    <div className="w-full max-w-[630px]">
      <StoriesRail />

      {error && (
        <p className="mb-4 rounded-lg border border-[var(--danger)] bg-[var(--dangerSoft)] px-4 py-3 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      )}

      {visibleFollowing.map((post, index) => (
        <PostCard key={post.postId} post={post} index={index} />
      ))}

      {nothingAtAll ? (
        <EmptyFeed t={t} />
      ) : (
        <section className="animate-fade-up flex flex-col items-center gap-2 py-10 text-center">
          <CheckCircleIcon size={96} />
          <h2 className="mt-2 text-[16px] font-medium text-[var(--fg)]">
            {t.caughtUpTitle}
          </h2>
          <p className="text-[13px] text-[var(--muted)]">
            {t.caughtUpText}
          </p>
          {!followingDone && (
            <button
              type="button"
              onClick={loadMoreFollowing}
              disabled={loadingMore}
              className="mt-1 rounded-full px-4 py-1.5 text-[13px] font-semibold text-[var(--accentA)] transition-all duration-200 hover:bg-[var(--panel)] active:scale-95 disabled:opacity-60"
            >
              {loadingMore ? t.loading : t.viewOlder}
            </button>
          )}
        </section>
      )}

      {visibleSuggested.length > 0 && (
        <section>
          <h2 className="animate-fade-in mb-3 flex items-center gap-2 text-[16px] font-semibold text-[var(--fg)]">
            {t.suggestedPosts}
            <span className="h-px flex-1 bg-[linear-gradient(90deg,var(--line),transparent)]" />
          </h2>
          {visibleSuggested.map((post, index) => (
            <PostCard
              key={post.postId}
              post={post}
              index={index}
              // Posti KHUDAM tugmai "Follow" naboyad dosad
              showFollow={post.userId !== me?.userId}
              initialFollowing={followingIds.has(post.userId)}
            />
          ))}
        </section>
      )}

      <div ref={sentinel} className="h-10" />

      {loadingMore && (
        <p className="animate-fade-in flex items-center justify-center gap-2 pb-8 text-center text-[13px] text-[var(--muted)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accentA)]" />
          {t.loading}
        </p>
      )}
    </div>
  );
}

function EmptyFeed({ t }: { t: Dict }) {
  return (
    <section className="animate-fade-up flex flex-col items-center gap-3 py-16 text-center text-[var(--muted)]">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--panel)] text-[var(--muted)]">
        <ImageIcon size={40} />
      </span>
      <h2 className="text-[16px] font-medium text-[var(--fg)]">{t.noPostsTitle}</h2>
      <p className="max-w-[320px] text-[13px]">{t.noPostsText}</p>
      <Link
        href="/create"
        className="mt-1 rounded-xl bg-[var(--accentA)] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(0,149,246,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1877f2] active:scale-95"
      >
        {t.createPost}
      </Link>
    </section>
  );
}

function PostSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      style={{ animationDelay: `${index * 120}ms` }}
      className="animate-fade-up mb-4 rounded-2xl border border-[var(--line)] p-3"
    >
      <div className="flex items-center gap-3 pb-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1.5">
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-2.5 w-16 rounded" />
        </div>
      </div>
      <div className="skeleton aspect-[4/5] w-full rounded-xl" />
      <div className="mt-3 flex gap-3">
        <div className="skeleton h-5 w-5 rounded-full" />
        <div className="skeleton h-5 w-5 rounded-full" />
        <div className="skeleton h-5 w-5 rounded-full" />
      </div>
      <div className="mt-3 h-3 w-24 skeleton rounded" />
    </div>
  );
}
