"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCount, shortTimeAgo, timeAgo } from "@/lib/format";
import type { Post, PostComment } from "@/lib/types";
import { Avatar } from "./Avatar";
import { CommentsModal } from "./CommentsModal";
import { PostMedia } from "./PostMedia";
import { useT } from "./LocaleProvider";
import {
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CommentIcon,
  DotsIcon,
  HeartIcon,
  ShareIcon,
} from "./icons";

const CAPTION_LIMIT = 125;

export function PostCard({
  post,
  showFollow = false,
  initialFollowing = false,
  index = 0,
}: {
  post: Post;
  showFollow?: boolean;
  /**
   * Man ba sohibi in post obuna hastam?
   *
   * KHATO BUD: peshtar in jo hamesha `false` bud, chunki server
   * dar khudi post chunin maidon namedihad. Natija: dar "Suggested
   * Posts" tugma HAMESHA "Follow" meguft - hatto ba onhoe ki
   * allakay obuna budi. Zadan khato medod ("allakay obuna").
   * Hozir <Feed> ro-ykhati obunahoi maro yak bor megirad
   * va in jo meguzoronad.
   */
  initialFollowing?: boolean;
  index?: number;
}) {
  const { t } = useT();
  const [liked, setLiked] = useState(post.postLike);
  const [likeCount, setLikeCount] = useState(post.postLikeCount);
  const [saved, setSaved] = useState(post.postFavorite);
  const [following, setFollowing] = useState(initialFollowing);
  const [comments, setComments] = useState<PostComment[]>(post.comments ?? []);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [slide, setSlide] = useState(0);
  const [burst, setBurst] = useState(false);

  // Ro-ykhati obunaho az server DERTAR meoyad - to on dam
  // initialFollowing "false" ast. Be in useEffect tugma dar
  // holati nodurust memond.
  useEffect(
    () => queueMicrotask(() => setFollowing(initialFollowing)),
    [initialFollowing],
  );

  // Nisbati qutti-i media. To surat naomadaast 4/5 (monandi instagram),
  // ba'd az omadan - nisbati TABI'II, vale mahdud: az 4/5 to 16/9.
  // Bе in suratkhoi pahn (screenshot-ho) bad burida meshudand.
  const [ratio, setRatio] = useState<{ slide: number; value: number } | null>(null);

  // Nisbat hamrohi raqami slaid nigoh doshta meshavad - slaidi nav
  // nisbati kuhnaro khud ba khud bekor mekunad (be useEffect).
  const own = ratio !== null && ratio.slide === slide ? ratio.value : null;
  const boxRatio = own === null ? 4 / 5 : Math.min(Math.max(own, 4 / 5), 16 / 9);
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

  // Vaqte oyna pushida meshavad - ruykhati kommenthoro nav mekunem,
  // to bori digar kusodani oyna ma'lumoti kuhnaro nanishonad.
  // (Dar zeri post kommentho digar nishon doda NAMESHAVAND -
  //  onho faqat daruni <CommentsModal> hastand.)
  const syncPreview = async () => {
    try {
      const response = await api.postComments(post.postId, { page: 1, pageSize: 50 });
      setComments(response.data ?? []);
    } catch {
      /* оставляем превью из ленты */
    }
  };

  const closeComments = () => {
    setCommentsOpen(false);
    void syncPreview();
  };

  const slides = post.images?.length ? post.images : [{ id: 0, imageName: null }];
  const caption = post.content ?? post.title ?? "";
  const clipped = !expanded && caption.length > CAPTION_LIMIT;

  return (
    <article
      ref={cardRef}
      style={{ animationDelay: `${Math.min(index, 6) * 90}ms` }}
      className="animate-fade-up mb-4 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-shadow duration-300 hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)]"
    >
      <header className="flex items-center gap-3 pb-3">
        <Link href={`/profile/${post.userId}`}>
          <Avatar src={post.userImage} name={post.userName} size={32} ring="gradient" />
        </Link>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/profile/${post.userId}`}
              className="truncate text-[14px] font-semibold transition-colors hover:text-[var(--accentA)]"
            >
              {post.userName}
            </Link>
            <span className="text-[14px] text-[var(--muted)]">·</span>
            <span className="text-[14px] text-[var(--muted)]">
              {shortTimeAgo(post.datePublished)}
            </span>
            {showFollow && (
              <>
                <span className="text-[14px] text-[var(--muted)]">·</span>
                <button
                  type="button"
                  onClick={toggleFollow}
                  className="text-[14px] font-semibold text-[var(--accentA)] transition-colors hover:text-[#00376b]"
                >
                  {following ? "Following" : "Follow"}
                </button>
              </>
            )}
          </div>
          {post.title && (
            <div className="truncate text-[12px] text-[var(--muted)]">{post.title}</div>
          )}
        </div>

        <button
          type="button"
          aria-label={t.moreOptions}
          className="rounded-full p-1.5 text-[var(--fg)] transition-colors hover:bg-[var(--panel)]"
        >
          <DotsIcon size={20} />
        </button>
      </header>

      <div
        onDoubleClick={doubleTapLike}
        style={{ aspectRatio: String(boxRatio) }}
        className="group/media relative w-full select-none overflow-hidden rounded-xl bg-[var(--panelSoft)] transition-[aspect-ratio] duration-300"
      >
        <PostMedia
          key={slides[slide]?.id ?? slide}
          fileName={slides[slide]?.imageName ?? null}
          alt={post.title ?? `Post by ${post.userName}`}
          onRatio={(value) => setRatio({ slide, value })}
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
                aria-label={t.previous}
                className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg)]/85 text-[var(--fg)] opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 group-hover/media:opacity-100"
              >
                <ChevronLeftIcon size={16} />
              </button>
            )}
            {slide < slides.length - 1 && (
              <button
                type="button"
                onClick={() => setSlide((current) => current + 1)}
                aria-label={t.next}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg)]/85 text-[var(--fg)] opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 group-hover/media:opacity-100"
              >
                <ChevronRightIcon size={16} />
              </button>
            )}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2 py-1 backdrop-blur-sm">
              {slides.map((item, position) => (
                <span
                  key={item.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    position === slide ? "w-4 bg-[var(--bg)]" : "w-1.5 bg-[var(--bg)]/60"
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
          aria-label={liked ? t.unlike : t.likeAction}
          className={`rounded-full p-1.5 transition-all duration-200 hover:bg-[var(--panel)] active:scale-90 ${
            liked ? "text-[#ff3040]" : "text-[var(--fg)]"
          }`}
        >
          <span key={pulse} className={pulse ? "block animate-pop" : "block"}>
            <HeartIcon filled={liked} />
          </span>
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen(true)}
          aria-label={t.comments}
          className="rounded-full p-1.5 text-[var(--fg)] transition-all duration-200 hover:bg-[var(--panel)] active:scale-90"
        >
          <CommentIcon />
        </button>
        <button
          type="button"
          aria-label={t.share}
          className="rounded-full p-1.5 text-[var(--fg)] transition-all duration-200 hover:bg-[var(--panel)] active:scale-90 hover:-rotate-12"
        >
          <ShareIcon />
        </button>
        <button
          type="button"
          onClick={toggleSave}
          aria-label={saved ? t.unsave : t.saveAction}
          className="ml-auto rounded-full p-1.5 text-[var(--fg)] transition-all duration-200 hover:bg-[var(--panel)] active:scale-90"
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
              className="text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
            >
              more
            </button>
          )}
        </p>
      )}

      <div className="mt-1.5 px-1.5 text-[11px] uppercase tracking-wide text-[#a8a8a8]">
        {timeAgo(post.datePublished)}
      </div>

      <CommentsModal
        postId={post.postId}
        open={commentsOpen}
        onClose={closeComments}
        initial={comments}
        count={commentCount}
        onCountChange={setCommentCount}
      />

    </article>
  );
}
