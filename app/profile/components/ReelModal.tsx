"use client";

// ============================================================
//  ReelModal - namoishi YAK video (reel).
//
//  Talaboti asosi: vaqte video kushoda meshavad ->
//  PROSMOTR va LIKE-ho nishon doda shavand.
//
//   1. POST /Reels/view-reels  -> prosmotr hisob meshavad
//   2. POST /Reels/like-reels  -> like meguzorad / pas megirad
//   3. GET  /Comment/get-reels-comments -> kommentho
//   4. POST /Comment/add-comment        -> kommenti nav
//   5. DELETE /Reels/delete-reels       -> tark kardan
// ============================================================
import { useEffect, useState } from "react";
import {
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  Trash2,
} from "lucide-react";

import {
  addComment,
  ApiError,
  deleteReel,
  getReelComments,
  likeReel,
  mediaUrl,
  viewReel,
  type Comment,
  type Reel,
} from "../api";
import { initials, shortNumber, timeAgo } from "../format";
import { useProfile } from "../providers";
import styles from "../profile.module.css";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { useT } from "@/components/LocaleProvider";

export default function ReelModal({
  reel,
  onClose,
}: {
  reel: Reel | null;
  onClose: () => void;
}) {
  const { t } = useT();
  const { token, patchReel, reload } = useProfile();

  const [data, setData] = useState<Reel | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);

  // Vaqte reel-i nav kushoda meshavad
  useEffect(() => {
    queueMicrotask(() => {
      setData(reel);
      setComments([]);
      setCommentText("");
    });

    if (reel === null || token === "") return;

    // 1) PROSMOTR: ba server megu-yem "man in videoro didam"
    viewReel(token, reel.reelsId)
      .then(() => {
        // Agar in bori AVVAL bosad - raqami prosmotr yakto ziyod meshavad
        if (!reel.reelsView) {
          const nextCount = reel.reelsViewCount + 1;

          setData((old) =>
            old === null
              ? old
              : { ...old, reelsView: true, reelsViewCount: nextCount }
          );
          patchReel(reel.reelsId, {
            reelsView: true,
            reelsViewCount: nextCount,
          });
        }
      })
      .catch(() => {});

    // 2) Kommentho
    getReelComments(token, reel.reelsId)
      .then((list) => setComments(Array.isArray(list) ? list : []))
      .catch(() => setComments([]));
    // patchReel har render nav meshavad, baroi hamin dar ro-ykhat nest
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel, token]);

  if (data === null) return null;

  const video = mediaUrl(data.videoName);
  const cover = mediaUrl(data.coverName);
  const avatar = mediaUrl(data.userImage);

  // ---------- LIKE ----------
  async function handleLike() {
    if (data === null) return;

    const liked = !data.reelsLike;
    const count = data.reelsLikeCount + (liked ? 1 : -1);

    setData({ ...data, reelsLike: liked, reelsLikeCount: count });
    patchReel(data.reelsId, { reelsLike: liked, reelsLikeCount: count });

    try {
      await likeReel(token, data.reelsId);
    } catch {
      // Khato -> pas megardonem
      setData({ ...data });
      patchReel(data.reelsId, {
        reelsLike: data.reelsLike,
        reelsLikeCount: data.reelsLikeCount,
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
        reelsId: data.reelsId,
      });

      if (created) setComments((old) => [created, ...old]);

      setCommentText("");
      setData({ ...data, commentCount: data.commentCount + 1 });
      patchReel(data.reelsId, { commentCount: data.commentCount + 1 });
    } catch (err) {
      console.error(err instanceof ApiError ? err.messages[0] : err);
    } finally {
      setBusy(false);
    }
  }

  // ---------- TARK KARDAN ----------
  async function handleDelete() {
    if (data === null) return;

    setBusy(true);

    try {
      await deleteReel(token, data.reelsId);
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
      <DialogContent className="max-w-3xl p-0">
        <DialogTitle className="sr-only">{data.title ?? "Reel"}</DialogTitle>

        <div className="grid md:grid-cols-[0.85fr_1fr]">
          {/* ================= VIDEO ================= */}
          <div
            className="bg-black md:border-r"
            style={{ borderColor: "var(--line)" }}
          >
            <div className={`${styles.cellTall} max-h-[70vh]`}>
              {video !== null && (
                <video
                  src={video}
                  poster={cover ?? undefined}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="h-full w-full object-contain"
                />
              )}
            </div>
          </div>

          {/* ================= MA'LUMOT ================= */}
          <div className="flex max-h-[70vh] flex-col">
            {/* --- korbar --- */}
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

            {/* --- RAQAMHO: PROSMOTR va LIKE (chizi asosi) --- */}
            <div
              className="grid grid-cols-2 border-b"
              style={{ borderColor: "var(--line)" }}
            >
              <BigStat
                icon={<Eye className="h-4 w-4" strokeWidth={1.6} />}
                label={t.views2}
                value={data.reelsViewCount}
              />
              <BigStat
                icon={<Heart className="h-4 w-4" strokeWidth={1.6} />}
                label={t.likes}
                value={data.reelsLikeCount}
                withBorder
              />
            </div>

            {/* --- matn va kommentho --- */}
            <div className={`${styles.scroll} flex-1 px-4 py-4`}>
              {data.title !== null && data.title !== "" && (
                <p className="text-sm font-bold uppercase tracking-[0.1em]">
                  {data.title}
                </p>
              )}

              {data.description !== null && data.description !== "" && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                  {data.description}
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

            {/* --- tugmaho --- */}
            <div
              className="flex items-center gap-5 border-t px-4 py-3"
              style={{ borderColor: "var(--line)" }}
            >
              <button
                type="button"
                onClick={handleLike}
                className="flex items-center gap-1.5 text-xs tabular-nums"
                style={{ color: data.reelsLike ? "var(--signal)" : "var(--fg)" }}
              >
                <Heart
                  className="h-4 w-4"
                  strokeWidth={1.6}
                  fill={data.reelsLike ? "currentColor" : "none"}
                />
                {shortNumber(data.reelsLikeCount)}
              </button>

              <span className="flex items-center gap-1.5 text-xs tabular-nums">
                <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
                {shortNumber(data.commentCount)}
              </span>

              <span className="flex items-center gap-1.5 text-xs tabular-nums">
                <Bookmark className="h-4 w-4" strokeWidth={1.6} />
                {shortNumber(data.reelsFavoriteCount)}
              </span>

              <span className="flex items-center gap-1.5 text-xs tabular-nums">
                <Repeat2 className="h-4 w-4" strokeWidth={1.6} />
                {shortNumber(data.repostCount)}
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

            {/* --- kommenti nav --- */}
            <form
              onSubmit={handleComment}
              className="flex items-center gap-3 border-t px-4 py-3"
              style={{ borderColor: "var(--line)" }}
            >
              <Input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder={t.addComment}
                maxLength={300}
                className="text-sm"
              />

              <Button
                type="submit"
                size="icon"
                variant="ghost"
                disabled={busy || commentText.trim() === ""}
                aria-label={t.sendAction}
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

// Yak khonai kalon: nishona + raqam + nom
function BigStat({
  icon,
  label,
  value,
  withBorder = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  withBorder?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-4 ${
        withBorder ? "border-l" : ""
      }`}
      style={{ borderColor: "var(--line)" }}
    >
      <span className="flex items-center gap-2 text-lg font-black tabular-nums">
        {icon}
        {shortNumber(value)}
      </span>

      <span
        className={`${styles.mono} mt-1 text-[9px] uppercase tracking-[0.28em]`}
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
    </div>
  );
}
