"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCount, shortTimeAgo, timeAgo } from "@/lib/format";
import type { Post, PostComment } from "@/lib/types";
import { Avatar } from "./Avatar";
import { PostMedia } from "./PostMedia";
import {
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CommentIcon,
  DotsIcon,
  EmojiIcon,
  HeartIcon,
  ShareIcon,
} from "./icons";

const CAPTION_LIMIT = 125;

export function PostCard({
  post,
  showFollow = false,
  index = 0,
}: {
  post: Post;
  showFollow?: boolean;
  index?: number;
}) {
  const [liked, setLiked] = useState(post.postLike);
  const [likeCount, setLikeCount] = useState(post.postLikeCount);
  const [saved, setSaved] = useState(post.postFavorite);
  const [following, setFollowing] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(post.comments ?? []);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [allLoaded, setAllLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [slide, setSlide] = useState(0);
  const [burst, setBurst] = useState(false);
  const [pulse, setPulse] = useState(0);

  const cardRef = useRef<HTMLElement>(null);
  const viewSent = useRef(post.postView);

  // Просмотр отмечаем один раз, когда карточка реально попала в кадр.
  useEffect(() => {
    const node = cardRef.current;
    if (!node || viewSent.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || viewSent.current) return;
        viewSent.current = true;
        observer.disconnect();
        void api.viewPost(post.postId).catch(() => {});
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [post.postId]);

  const sendLike = async (next: boolean) => {
    setLiked(next);
    setLikeCount((count) => Math.max(0, count + (next ? 1 : -1)));
    setPulse((value) => value + 1);
    try {
      await api.likePost(post.postId);
    } catch {
      setLiked(!next);
      setLikeCount((count) => Math.max(0, count + (next ? -1 : 1)));
    }
  };

  // Двойной клик по фото — лайк с всплывающим сердцем, как в приложении.
  const doubleTapLike = () => {
    setBurst(true);
    if (!liked) void sendLike(true);
  };

  const toggleSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      await api.favoritePost(post.postId);
    } catch {
      setSaved(!next);
    }
  };

  const toggleFollow = async () => {
    const next = !following;
    setFollowing(next);
    try {
      if (next) await api.follow(post.userId);
      else await api.unfollow(post.userId);
    } catch {
      setFollowing(!next);
    }
  };

  const loadAllComments = async () => {
    if (allLoaded) return;
    try {
      const response = await api.postComments(post.postId, { page: 1, pageSize: 50 });
      setComments(response.data ?? []);
      setAllLoaded(true);
    } catch {
      /* оставляем превью из ленты */
    }
  };

  const submitComment = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await api.addComment(post.postId, text);
      const response = await api.postComments(post.postId, { page: 1, pageSize: 50 });
      setComments(response.data ?? []);
      setCommentCount((count) => count + 1);
      setAllLoaded(true);
      setDraft("");
    } catch {
      /* ввод не теряем, пользователь может повторить */
    } finally {
      setSending(false);
    }
  };

  const slides = post.images?.length ? post.images : [{ id: 0, imageName: null }];
  const caption = post.content ?? post.title ?? "";
  const clipped = !expanded && caption.length > CAPTION_LIMIT;
  const preview = allLoaded ? comments : comments.slice(0, 2);

  return (
    <article
      ref={cardRef}
      style={{ animationDelay: `${Math.min(index, 6) * 90}ms` }}
      className="animate-fade-up mb-4 rounded-2xl border border-[#efefef] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-shadow duration-300 hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)]"
    >
      <header className="flex items-center gap-3 pb-3">
        <Link href={`/profile/${post.userId}`}>
          <Avatar src={post.userImage} name={post.userName} size={32} ring="gradient" />
        </Link>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/profile/${post.userId}`}
              className="truncate text-[14px] font-semibold transition-colors hover:text-[#0095f6]"
            >
              {post.userName}
            </Link>
            <span className="text-[14px] text-[#737373]">·</span>
            <span className="text-[14px] text-[#737373]">
              {shortTimeAgo(post.datePublished)}
            </span>
            {showFollow && (
              <>
                <span className="text-[14px] text-[#737373]">·</span>
                <button
                  type="button"
                  onClick={toggleFollow}
                  className="text-[14px] font-semibold text-[#0095f6] transition-colors hover:text-[#00376b]"
                >
                  {following ? "Following" : "Follow"}
                </button>
              </>
            )}
          </div>
          {post.title && (
            <div className="truncate text-[12px] text-[#737373]">{post.title}</div>
          )}
        </div>

        <button
          type="button"
          aria-label="More options"
          className="rounded-full p-1.5 text-[#262626] transition-colors hover:bg-[#f5f5f5]"
        >
          <DotsIcon size={20} />
        </button>
      </header>

      <div
        onDoubleClick={doubleTapLike}
        className="group/media relative aspect-[4/5] w-full select-none overflow-hidden rounded-xl bg-[#fafafa]"
      >
        <PostMedia
          key={slides[slide]?.id ?? slide}
          fileName={slides[slide]?.imageName ?? null}
          alt={post.title ?? `Post by ${post.userName}`}
          zoom
        />

        {burst && (
          <span
            onAnimationEnd={() => setBurst(false)}
            className="animate-burst pointer-events-none absolute inset-0 flex items-center justify-center text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.4)]"
          >
            <HeartIcon size={110} filled />
          </span>
        )}

        {slides.length > 1 && (
          <>
            {slide > 0 && (
              <button
                type="button"
                onClick={() => setSlide((current) => current - 1)}
                aria-label="Previous"
                className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#262626] opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 group-hover/media:opacity-100"
              >
                <ChevronLeftIcon size={16} />
              </button>
            )}
            {slide < slides.length - 1 && (
              <button
                type="button"
                onClick={() => setSlide((current) => current + 1)}
                aria-label="Next"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#262626] opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 group-hover/media:opacity-100"
              >
                <ChevronRightIcon size={16} />
              </button>
            )}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2 py-1 backdrop-blur-sm">
              {slides.map((item, position) => (
                <span
                  key={item.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    position === slide ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 pb-1 pt-2">
        <button
          type="button"
          onClick={() => void sendLike(!liked)}
          aria-label={liked ? "Unlike" : "Like"}
          className={`rounded-full p-1.5 transition-all duration-200 hover:bg-[#f5f5f5] active:scale-90 ${
            liked ? "text-[#ff3040]" : "text-[#262626]"
          }`}
        >
          <span key={pulse} className={pulse ? "block animate-pop" : "block"}>
            <HeartIcon filled={liked} />
          </span>
        </button>
        <button
          type="button"
          onClick={loadAllComments}
          aria-label="Comments"
          className="rounded-full p-1.5 text-[#262626] transition-all duration-200 hover:bg-[#f5f5f5] active:scale-90"
        >
          <CommentIcon />
        </button>
        <button
          type="button"
          aria-label="Share"
          className="rounded-full p-1.5 text-[#262626] transition-all duration-200 hover:bg-[#f5f5f5] active:scale-90 hover:-rotate-12"
        >
          <ShareIcon />
        </button>
        <button
          type="button"
          onClick={toggleSave}
          aria-label={saved ? "Remove from saved" : "Save"}
          className="ml-auto rounded-full p-1.5 text-[#262626] transition-all duration-200 hover:bg-[#f5f5f5] active:scale-90"
        >
          <span className={saved ? "block animate-pop" : "block"}>
            <BookmarkIcon filled={saved} />
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2 px-1.5 pb-1.5">
        <Avatar src={post.userImage} name={post.userName} size={18} interactive={false} />
        <span className="text-[14px] font-semibold">
          {formatCount(likeCount)} {likeCount === 1 ? "like" : "likes"}
        </span>
      </div>

      {caption && (
        <p className="px-1.5 text-[14px] leading-[19px]">
          <Link href={`/profile/${post.userId}`} className="font-semibold">
            {post.userName}
          </Link>{" "}
          {clipped ? `${caption.slice(0, CAPTION_LIMIT).trimEnd()}... ` : caption}
          {clipped && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-[#8e8e8e] transition-colors hover:text-[#262626]"
            >
              more
            </button>
          )}
        </p>
      )}

      {commentCount > preview.length && (
        <button
          type="button"
          onClick={loadAllComments}
          className="mt-1 block px-1.5 text-[14px] text-[#8e8e8e] transition-colors hover:text-[#262626]"
        >
          View all {formatCount(commentCount)} comments
        </button>
      )}

      {preview.length > 0 && (
        <ul className="mt-1 space-y-0.5 px-1.5">
          {preview.map((comment, position) => (
            <li
              key={comment.commentId}
              style={{ animationDelay: `${position * 60}ms` }}
              className="animate-fade-in text-[14px] leading-[19px]"
            >
              <Link href={`/profile/${comment.userId}`} className="font-semibold">
                {comment.userName}
              </Link>{" "}
              {comment.comment}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-1.5 px-1.5 text-[11px] uppercase tracking-wide text-[#a8a8a8]">
        {timeAgo(post.datePublished)}
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#fafafa] px-3 py-2 transition-colors focus-within:bg-[#f2f2f2]">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submitComment();
          }}
          placeholder="Add a comment..."
          className="min-w-0 flex-1 bg-transparent text-[14px] text-[#262626] outline-none placeholder:text-[#8e8e8e]"
        />
        {draft.trim() && (
          <button
            type="button"
            onClick={submitComment}
            disabled={sending}
            className="animate-scale-in text-[14px] font-semibold text-[#0095f6] transition-transform active:scale-95 disabled:opacity-50"
          >
            Post
          </button>
        )}
        <button
          type="button"
          aria-label="Emoji"
          className="text-[#8e8e8e] transition-all duration-200 hover:scale-110 hover:text-[#262626]"
        >
          <EmojiIcon size={20} />
        </button>
      </div>
    </article>
  );
}
