"use client";

// ============================================================
//  StoryViewer - namoishi story dar tamomi ekran.
//
//  Chi kor mekunad:
//   1. suratro kalon nishon medihad
//   2. ba server megu-yad "man didam"  -> POST /Story/add-story-view
//   3. hisobi didaho va like-ho az server nishon medihad
//   4. tugmai tark kardan (DELETE /Story/DeleteStory)
// ============================================================
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Heart, Trash2, X } from "lucide-react";

import {
  ApiError,
  deleteStory,
  mediaUrl,
  viewStory,
  type Story,
} from "../api";
import { initials, shortDate } from "../format";
import { useProfile } from "../providers";
import styles from "../profile.module.css";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";

export default function StoryViewer({
  stories,
  index,
  onChangeIndex,
  onClose,
}: {
  stories: Story[];
  index: number | null;
  onChangeIndex: (next: number) => void;
  onClose: () => void;
}) {
  const { token, reload, profile } = useProfile();
  const [busy, setBusy] = useState(false);

  // Story-i hozira. Agar index nabosad -> null.
  const story = index === null ? null : stories[index] ?? null;

  // Har bor ki story ivaz meshavad -> ba server megu-yem "didam".
  useEffect(() => {
    if (story === null || token === "") return;

    // Agar khato dihad ham, sahifa nashkanad - baroi hamin catch.
    viewStory(token, story.id).catch(() => {});
  }, [story, token]);

  if (story === null || index === null) return null;

  const src = mediaUrl(story.fileName);
  const avatar = mediaUrl(story.userAvatar) ?? mediaUrl(profile?.image);
  const userName = profile?.userName ?? "STORY";
  const views = story.viewerDto?.viewCount ?? 0;
  const likes = story.viewerDto?.viewLike ?? 0;

  // Storyi peshina / oyanda
  function goPrev() {
    if (index !== null && index > 0) onChangeIndex(index - 1);
  }

  function goNext() {
    if (index !== null && index < stories.length - 1) onChangeIndex(index + 1);
  }

  // Tark kardani story
  async function handleDelete() {
    if (story === null) return;

    setBusy(true);

    try {
      await deleteStory(token, story.id);
      await reload();
      onClose();
    } catch (err) {
      // Agar server ijozat nadihad - faqat modalro kushoda meguzorem
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
      <DialogContent className="max-w-[440px] p-0" showClose={false}>
        <DialogTitle className="sr-only">STORY</DialogTitle>

        {/* ================= SAHNA ================= */}
        <div className={styles.stage}>
          {/* Pasazaminai mahv - joi kholiro por mekunad (na navori siyoh) */}
          {src !== null && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" aria-hidden className={styles.stageBlur} />
          )}

          {src !== null && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Story" className={styles.stageMedia} />
          )}

          <div className={styles.stageTopScrim} />

          {/* ---------- Bolo: navorho + korbar + bastan ---------- */}
          <div className="absolute inset-x-0 top-0 z-10 px-3 pt-3">
            <div className="flex gap-1.5">
              {stories.map((item, i) => (
                <span
                  key={item.id}
                  className={`${styles.track} ${i <= index ? styles.trackOn : ""}`}
                />
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2.5">
              <span className={styles.ring}>
                <Avatar className="h-8 w-8 border-2 border-[var(--bg)]">
                  {avatar !== null && <AvatarImage src={avatar} alt={userName} />}
                  <AvatarFallback className="text-[10px]">
                    {initials(userName)}
                  </AvatarFallback>
                </Avatar>
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold uppercase tracking-[0.14em] text-white">
                  {userName}
                </p>
                <p
                  className={`${styles.mono} text-[9px] uppercase tracking-[0.2em] text-white/60`}
                >
                  {shortDate(story.createAt)}
                </p>
              </div>

              <DialogClose
                aria-label="Bastan"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-all duration-200 hover:bg-black/70 active:scale-95"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </DialogClose>
            </div>
          </div>

          {/* ---------- Tugmahoi chap va rost ---------- */}
          {index > 0 && (
            <button
              type="button"
              onClick={goPrev}
              aria-label="Peshina"
              className={`${styles.navSide} left-0`}
            >
              <span>
                <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
              </span>
            </button>
          )}

          {index < stories.length - 1 && (
            <button
              type="button"
              onClick={goNext}
              aria-label="Oyanda"
              className={`${styles.navSide} right-0`}
            >
              <span>
                <ChevronRight className="h-5 w-5" strokeWidth={1.8} />
              </span>
            </button>
          )}
        </div>

        {/* ================= POYON: hisobho ================= */}
        <div
          className="flex items-center justify-between gap-4 border-t px-4 py-3"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="flex items-center gap-4">
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs tabular-nums"
              style={{ background: "var(--panel)" }}
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={1.6} />
              {views}
            </span>

            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs tabular-nums"
              style={{ background: "var(--panel)" }}
            >
              <Heart className="h-3.5 w-3.5" strokeWidth={1.6} />
              {likes}
            </span>

            <span
              className={`${styles.mono} text-[10px] uppercase tracking-[0.18em]`}
              style={{ color: "var(--muted)" }}
            >
              {index + 1} / {stories.length}
            </span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={busy}
            className="gap-1.5 text-[#ed4956] hover:bg-[#ed4956]/10 hover:text-[#ed4956]"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            TARK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
