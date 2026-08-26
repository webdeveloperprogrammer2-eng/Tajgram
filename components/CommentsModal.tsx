"use client";

// ============================================================
//  CommentsModal - hamai komentho dar YAK oynai calohida.
//
//  CHARO?
//  Peshtar komentho dar zeri post "chapida" mesuchidand va
//  maidoni navishtan hamesha on co bud. Hozir:
//    - dar telefon  -> варақаи az poyon barojanda (bottom sheet)
//    - dar kompyuter -> oynai markazi
//  Komentho hangomi kushodan az server bor meshavand.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCount, timeAgo } from "@/lib/format";
import type { PostComment } from "@/lib/types";
import { Avatar } from "./Avatar";
import { EmojiIcon } from "./icons";
import { useT } from "./LocaleProvider";

export function CommentsModal({
  postId,
  open,
  onClose,
  initial = [],
  count,
  onCountChange,
}: {
  postId: number;
  open: boolean;
  onClose: () => void;
  /** Se komenti okhirin ki alakay dar lenta hastand - to oyna kholi nabosad */
  initial?: PostComment[];
  count: number;
  onCountChange: (next: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(initial);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState("");
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => queueMicrotask(() => setMounted(true)), []);

  // Har bor ki oyna kushoda meshavad - ruykhati purra
  useEffect(() => {
    if (!open) return;
    let alive = true;

    queueMicrotask(() => setLoading(true));
    api
      .postComments(postId, { page: 1, pageSize: 100 })
      .then((response) => {
        if (alive) setComments(response.data ?? []);
      })
      .catch(() => {
        // Ruykhati peshaki memonad
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [open, postId]);

  // Esc -> pushidan, va sahifai poyon nalagzad
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setFailed("");
    try {
      await api.addComment(postId, text);
      const response = await api.postComments(postId, { page: 1, pageSize: 100 });
      const next = response.data ?? [];
      setComments(next);
      onCountChange(next.length);
      setDraft("");
      inputRef.current?.focus();
    } catch (cause: unknown) {
      // Matni navishtaro NAMEBAREM - kas metavonad boz kushish kunad
      setFailed(cause instanceof Error ? cause.message : t.sendFailed);
    } finally {
      setSending(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-[3px] sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="animate-sheet-up flex max-h-[86dvh] w-full flex-col overflow-hidden rounded-t-[26px] border border-[var(--line)] bg-[var(--bg)] shadow-[var(--shadow)] sm:max-h-[78dvh] sm:max-w-[480px] sm:rounded-[26px]"
      >
        {/* ---------- Sarlavha ---------- */}
        <header className="relative flex shrink-0 items-center justify-center border-b border-[var(--line)] px-4 py-3.5">
          {/* Dastaki kashidan - faqat dar telefon */}
          <span className="absolute top-1.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-[var(--lineStrong)] sm:hidden" />

          <h2 className="text-[15px] font-semibold">
            {t.comments}{count > 0 && ` · ${formatCount(count)}`}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors duration-200 hover:bg-[var(--panel)] hover:text-[var(--fg)]"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {/* ---------- Ruykhat ---------- */}
        <div className="min-h-[180px] flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          {loading && comments.length === 0 ? (
            <ul className="space-y-4">
              {[0, 1, 2, 3].map((row) => (
                <li key={row} className="flex gap-3">
                  <span className="skeleton h-8 w-8 shrink-0 rounded-full" />
                  <span className="flex-1 space-y-2">
                    <span className="skeleton block h-3 w-28 rounded-full" />
                    <span className="skeleton block h-3 w-full rounded-full" />
                  </span>
                </li>
              ))}
            </ul>
          ) : comments.length === 0 ? (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-center">
              <p className="text-[17px] font-semibold">{t.noComments}</p>
              <p className="text-[13px] text-[var(--muted)]">
                {t.beFirstComment}
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {comments.map((comment, position) => (
                <li
                  key={comment.commentId}
                  style={{ animationDelay: `${Math.min(position, 10) * 35}ms` }}
                  className="animate-fade-up flex gap-3"
                >
                  <Link href={`/profile/${comment.userId}`} className="shrink-0">
                    <Avatar
                      src={comment.userImage}
                      name={comment.userName}
                      size={34}
                      ring="none"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-[19px]">
                      <Link
                        href={`/profile/${comment.userId}`}
                        className="font-semibold transition-colors hover:text-[var(--accentA)]"
                      >
                        {comment.userName}
                      </Link>{" "}
                      <span className="break-words">{comment.comment}</span>
                    </p>
                    <span className="mt-0.5 block text-[11px] tracking-wide text-[var(--muted)] uppercase">
                      {timeAgo(comment.dateCommented)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ---------- Maidoni navishtan ---------- */}
        <div className="shrink-0 border-t border-[var(--line)] p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          {failed !== "" && (
            <p className="mb-2 px-1 text-[12px] text-[var(--signal)]">{failed}</p>
          )}

          <div className="flex items-center gap-2 rounded-full bg-[var(--panelSoft)] px-4 py-2.5 transition-colors focus-within:bg-[var(--panel)]">
            <button
              type="button"
              aria-label={t.emoji}
              className="shrink-0 text-[var(--muted)] transition-all duration-200 hover:scale-110 hover:text-[var(--fg)]"
            >
              <EmojiIcon size={20} />
            </button>

            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void send();
              }}
              placeholder={t.addComment}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--fg)] outline-none placeholder:text-[var(--muted)]"
            />

            <button
              type="button"
              onClick={send}
              disabled={sending || draft.trim() === ""}
              className="shrink-0 rounded-full bg-[linear-gradient(115deg,var(--accentA),var(--accentB))] px-4 py-1.5 text-[13px] font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:shadow-none"
            >
              {sending ? "..." : t.sendAction}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
