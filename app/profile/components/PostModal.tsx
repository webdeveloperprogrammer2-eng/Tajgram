"use client";

// ============================================================
//  PostModal - namoishi YAK post dar modal.
//
//  Chi kor mekunad:
//   1. suratho (agar chandto bosad - chap/rost)
//   2. POST /Post/view-post   -> prosmotr hisob meshavad
//   3. POST /Post/like-post   -> like meguzorad / pas megirad
//   4. GET  /Comment/get-post-comments -> kommentho
//   5. POST /Comment/add-comment       -> kommenti nav
//   6. DELETE /Post/delete-post        -> tark kardani post
// ============================================================
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  Send,
  Trash2,
} from "lucide-react";

import {
  addComment,
  ApiError,
  deletePost,
  getPostComments,
  likePost,
  mediaUrl,
  viewPost,
  type Comment,
  type Post,
} from "../api";
import { initials, shortNumber, timeAgo } from "../format";
import { useProfile } from "../providers";
import styles from "../profile.module.css";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";

export default function PostModal({
  post,
  onClose,
}: {
  post: Post | null;
  onClose: () => void;
}) {
  const { token, patchPost, reload } = useProfile();

  // Nuskhai post dar in modal (ki like-ro darhol nishon dihem)
  const [data, setData] = useState<Post | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);

  // Vaqte posti nav kushoda meshavad -> hama chizro az nav meguzorem
  useEffect(() => {
    setData(post);
    setImageIndex(0);
    setComments([]);
    setCommentText("");

    if (post === null || token === "") return;

    // 1) Ba server megu-yem: "man in postro didam"
    viewPost(token, post.postId).catch(() => {});

    // 2) Kommenthoro megirem
    getPostComments(token, post.postId)
      .then((list) => setComments(Array.isArray(list) ? list : []))
      .catch(() => setComments([]));
  }, [post, token]);

  if (data === null) return null;

  const images = data.images;
  const currentImage = mediaUrl(images[imageIndex]?.imageName);
  const avatar = mediaUrl(data.userImage);

  // ---------- LIKE ----------
  async function handleLike() {
    if (data === null) return;

    // Avval dar ekran ivaz mekunem (ki tez bosad),
    // ba'd ba server mefiristem.
    const liked = !data.postLike;
    const count = data.postLikeCount + (liked ? 1 : -1);

    setData({ ...data, postLike: liked, postLikeCount: count });
    patchPost(data.postId, { postLike: liked, postLikeCount: count });

    try {
      await likePost(token, data.postId);
    } catch {
      // Agar server khato dod - pas megardonem
      setData({ ...data });
      patchPost(data.postId, {
        postLike: data.postLike,
        postLikeCount: data.postLikeCount,
      });
    }
  }

  // ---------- KOMMENTI NAV ----------
  async function handleComment(event: React.FormEvent) {
    event.preventDefault();
    if (data === null) return;

    const text = commentText.trim();
    if (text === "") return;

    setBusy(true);

    try {
      const created = await addComment(token, {
        comment: text,
        postId: data.postId,
      });

      if (created) setComments((old) => [created, ...old]);

      setCommentText("");
      setData({ ...data, commentCount: data.commentCount + 1 });
      patchPost(data.postId, { commentCount: data.commentCount + 1 });
    } catch (err) {
      console.error(err instanceof ApiError ? err.messages[0] : err);
    } finally {
      setBusy(false);
    }
  }

  // ---------- TARK KARDANI POST ----------
  async function handleDelete() {
    if (data === null) return;

    setBusy(true);

    try {
      await deletePost(token, data.postId);
      await reload();
      onClose();
    } catch (err) {
      console.error(err instanceof ApiError ? err.messages[0] : err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-w-4xl p-0">
        <DialogTitle className="sr-only">
          {data.title ?? "Post"}
        </DialogTitle>

        <div className="grid md:grid-cols-[1.15fr_1fr]">
          {/* ================= SURAT ================= */}
          <div
            className="relative bg-[var(--panel)] md:border-r"
            style={{ borderColor: "var(--line)" }}
          >
            <div className={styles.cell}>
              {currentImage !== null && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentImage}
                  alt={data.title ?? "Post"}
                  className="h-full w-full object-contain"
                />
              )}

              {/* Agar chand surat bosad - tugmahoi chap/rost */}
              {images.length > 1 && (
                <>
                  {imageIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => setImageIndex(imageIndex - 1)}
                      aria-label="Surati peshina"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 p-1.5 text-white"
                    >
                      <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  )}

                  {imageIndex < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setImageIndex(imageIndex + 1)}
                      aria-label="Surati oyanda"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 p-1.5 text-white"
                    >
                      <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  )}

                  <span
                    className={`${styles.mono} absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 px-2 py-0.5 text-[10px] tracking-[0.2em] text-white`}
                  >
                    {imageIndex + 1} / {images.length}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ================= MA'LUMOT ================= */}
          <div className="flex max-h-[70vh] flex-col">
            {/* --- Sarlavha: korbar --- */}
            <div
              className="flex items-center gap-3 border-b px-4 py-3 pr-12"
              style={{ borderColor: "var(--line)" }}
            >
              <Avatar className="h-9 w-9">
                {avatar !== null && (
                  <AvatarImage src={avatar} alt={data.userName} />
                )}
                <AvatarFallback className="text-[10px]">
                  {initials(data.userName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-[0.14em]">
                  {data.userName}
                </p>
                <p
                  className={`${styles.mono} text-[9px] uppercase tracking-[0.2em]`}
                  style={{ color: "var(--muted)" }}
                >
                  {timeAgo(data.datePublished)}
                </p>
              </div>
            </div>

            {/* --- Matn va kommentho --- */}
            <div className={`${styles.scroll} flex-1 px-4 py-4`}>
              {data.title !== null && data.title !== "" && (
                <p className="text-sm font-bold uppercase tracking-[0.1em]">
                  {data.title}
                </p>
              )}

              {data.content !== null && data.content !== "" && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                  {data.content}
                </p>
              )}

              <div
                className="mt-4 space-y-4 border-t pt-4"
                style={{ borderColor: "var(--line)" }}
              >
                {comments.length === 0 && (
                  <p
                    className={`${styles.mono} text-[10px] uppercase tracking-[0.22em]`}
                    style={{ color: "var(--muted)" }}
                  >
                    — HANUZ KOMMENT NEST —
                  </p>
                )}

                {comments.map((item) => (
                  <div key={item.commentId} className="flex gap-3">
                    <Avatar className="h-7 w-7 shrink-0">
                      {mediaUrl(item.userImage) !== null && (
                        <AvatarImage
                          src={mediaUrl(item.userImage) as string}
                          alt={item.userName}
                        />
                      )}
                      <AvatarFallback className="text-[9px]">
                        {initials(item.userName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em]">
                        {item.userName}
                      </p>
                      <p className="break-words text-sm leading-snug">
                        {item.comment}
                      </p>
                      <p
                        className={`${styles.mono} mt-1 text-[9px] uppercase tracking-[0.2em]`}
                        style={{ color: "var(--muted)" }}
                      >
                        {timeAgo(item.dateCommented)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Raqamho: like / komment / prosmotr --- */}
            <div
              className="flex items-center gap-5 border-t px-4 py-3"
              style={{ borderColor: "var(--line)" }}
            >
              <button
                type="button"
                onClick={handleLike}
                className="flex items-center gap-1.5 text-xs tabular-nums transition-colors duration-150"
                style={{ color: data.postLike ? "var(--signal)" : "var(--fg)" }}
              >
                <Heart
                  className="h-4 w-4"
                  strokeWidth={1.6}
                  fill={data.postLike ? "currentColor" : "none"}
                />
                {shortNumber(data.postLikeCount)}
              </button>

              <span className="flex items-center gap-1.5 text-xs tabular-nums">
                <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
                {shortNumber(data.commentCount)}
              </span>

              <span className="flex items-center gap-1.5 text-xs tabular-nums">
                <Eye className="h-4 w-4" strokeWidth={1.6} />
                {shortNumber(data.postViewCount)}
              </span>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={busy}
                className="ml-auto gap-1.5"
              >
                <Trash2 className="h-3 w-3" strokeWidth={1.6} />
                TARK
              </Button>
            </div>

            {/* --- Kommenti nav --- */}
            <form
              onSubmit={handleComment}
              className="flex items-center gap-3 border-t px-4 py-3"
              style={{ borderColor: "var(--line)" }}
            >
              <Input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Komment navised..."
                maxLength={300}
                className="text-sm"
              />

              <Button
                type="submit"
                size="icon"
                variant="ghost"
                disabled={busy || commentText.trim() === ""}
                aria-label="Firistodan"
              >
                <Send className="h-4 w-4" strokeWidth={1.6} />
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
