"use client";

// ============================================================
//  CommentsSheet - panel-i kommentho baroi yak reels.
//    GET  /Comment/get-reels-comments?ReelsId=
//    POST /Comment/add-comment   { comment, reelsId }
//    POST /Comment/like-comment?commentId=
//
//  Hamai kommentho az server meoyand - hech kommenti soakhta nest.
// ============================================================
import { useEffect, useState } from "react";
import { Heart, Send, X } from "lucide-react";

import {
  addReelComment,
  errorText,
  getReelComments,
  likeComment,
  mediaUrl,
  type Comment,
  type Reel,
} from "../api";
import { initials, shortNumber, timeAgo } from "../format";
import { useReels } from "../providers";
import styles from "../reels.module.css";

export default function CommentsSheet({
  reel,
  onClose,
}: {
  reel: Reel | null;
  onClose: () => void;
}) {
  const { token, patchReel } = useReels();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const reelsId = reel?.reelsId ?? null;

  useEffect(() => {
    if (reelsId === null) return;

    let alive = true;
    setLoading(true);
    setError("");
    setComments([]);

    getReelComments(token, reelsId)
      .then((list) => {
        if (!alive) return;
        setComments(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(errorText(err, "Kommentho bor nashudand."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token, reelsId]);

  if (reel === null) return null;

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (reel === null || text.trim() === "") return;

    setSending(true);
    setError("");

    try {
      const created = await addReelComment(token, reel.reelsId, text.trim());

      if (created) setComments((old) => [created, ...old]);
      else {
        const list = await getReelComments(token, reel.reelsId);
        setComments(Array.isArray(list) ? list : []);
      }

      patchReel(reel.reelsId, { commentCount: reel.commentCount + 1 });
      setText("");
    } catch (err) {
      setError(errorText(err, "Komment guzoshta nashud."));
    } finally {
      setSending(false);
    }
  }

  async function handleLike(comment: Comment) {
    const liked = !comment.isLiked;

    setComments((old) =>
      old.map((item) =>
        item.commentId === comment.commentId
          ? {
              ...item,
              isLiked: liked,
              likeCount: item.likeCount + (liked ? 1 : -1),
            }
          : item
      )
    );

    try {
      await likeComment(token, comment.commentId);
    } catch {
      setComments((old) =>
        old.map((item) =>
          item.commentId === comment.commentId
            ? { ...item, isLiked: comment.isLiked, likeCount: comment.likeCount }
            : item
        )
      );
    }
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden />

      <div className={styles.sheet} role="dialog" aria-modal="true">
        {/* ---------- Sarlavha ---------- */}
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--line)" }}
        >
          <h2 className="text-[15px] font-bold tracking-tight">
            Kommentho{" "}
            <span className="font-normal" style={{ color: "var(--muted)" }}>
              {shortNumber(reel.commentCount)}
            </span>
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Bastan"
            className={styles.iconBtn}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* ---------- Ro-ykhat ---------- */}
        <div className={`${styles.scroll} flex-1 px-5 py-4`}>
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={styles.skeleton}
                  style={{ height: 40, borderRadius: 16 }}
                />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p
              className="py-14 text-center text-[13px]"
              style={{ color: "var(--muted)" }}
            >
              Hanuz komment nest. Avvalin komment az shumo boshad.
            </p>
          ) : (
            <div className="space-y-5">
              {comments.map((comment) => {
                const avatar = mediaUrl(comment.userImage);

                return (
                  <div key={comment.commentId} className="flex gap-3">
                    <span
                      className={styles.ring}
                      style={{ height: 34, width: 34, flexShrink: 0 }}
                    >
                      <span className={styles.ringInner} style={{ fontSize: 11 }}>
                        {avatar !== null ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatar}
                            alt={comment.userName}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          initials(comment.userName)
                        )}
                      </span>
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[13px]">
                        <span className="font-semibold">{comment.userName}</span>{" "}
                        <span style={{ color: "var(--muted)" }}>
                          {timeAgo(comment.dateCommented)}
                        </span>
                      </p>
                      <p className="mt-0.5 break-words text-[14px] leading-relaxed">
                        {comment.comment}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLike(comment)}
                      aria-label="Bayan"
                      className="flex shrink-0 flex-col items-center gap-0.5 text-[11px]"
                      style={{
                        color: comment.isLiked
                          ? "var(--signal)"
                          : "var(--muted)",
                      }}
                    >
                      <Heart
                        className={`h-4 w-4 ${comment.isLiked ? "fill-current" : ""}`}
                        strokeWidth={1.9}
                      />
                      {comment.likeCount > 0 && shortNumber(comment.likeCount)}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ---------- Khato ---------- */}
        {error !== "" && (
          <p
            className="px-5 pb-2 text-[12px]"
            style={{ color: "var(--signal)" }}
          >
            {error}
          </p>
        )}

        {/* ---------- Maidoni navishtan ---------- */}
        <form onSubmit={handleSend} className="shrink-0 px-5 pb-5 pt-1">
          <div className={styles.composer}>
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Komment navised..."
              className={styles.composerInput}
              maxLength={300}
            />

            <button
              type="submit"
              disabled={sending || text.trim() === ""}
              aria-label="Firistodan"
              className={styles.sendBtn}
            >
              {sending ? (
                <span className={styles.blocks}>
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                <Send className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
