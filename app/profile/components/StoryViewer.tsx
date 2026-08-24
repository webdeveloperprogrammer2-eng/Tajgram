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
import { ChevronLeft, ChevronRight, Eye, Heart, Trash2 } from "lucide-react";

import {
  ApiError,
  deleteStory,
  mediaUrl,
  viewStory,
  type Story,
} from "../api";
import { shortDate } from "../format";
import { useProfile } from "../providers";
import styles from "../profile.module.css";

import { Button } from "../ui/button";
import {
  Dialog,
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
  const { token, reload } = useProfile();
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
      <DialogContent className="max-w-[420px] p-0">
        <DialogTitle className="sr-only">STORY</DialogTitle>

        {/* ---------- Khathoi bolo (kadom story) ---------- */}
        <div className="flex gap-1 p-3">
          {stories.map((item, i) => (
            <span
              key={item.id}
              className="h-[2px] flex-1"
              style={{
                background: i <= index ? "var(--signal)" : "var(--lineStrong)",
              }}
            />
          ))}
        </div>

        {/* ---------- Surat ---------- */}
        <div className={`${styles.cellTall} max-h-[70vh]`}>
          {src !== null && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Story" className="h-full w-full object-contain" />
          )}

          {/* Tugmahoi chap va rost */}
          {index > 0 && (
            <button
              type="button"
              onClick={goPrev}
              aria-label="Peshina"
              className="absolute left-0 top-0 flex h-full w-14 items-center justify-center text-white/70 hover:text-white"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={1.4} />
            </button>
          )}

          {index < stories.length - 1 && (
            <button
              type="button"
              onClick={goNext}
              aria-label="Oyanda"
              className="absolute right-0 top-0 flex h-full w-14 items-center justify-center text-white/70 hover:text-white"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={1.4} />
            </button>
          )}
        </div>

        {/* ---------- Poyon: hisobho ---------- */}
        <div
          className="flex items-center justify-between border-t px-4 py-3"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-xs tabular-nums">
              <Eye className="h-3.5 w-3.5" strokeWidth={1.6} />
              {views}
            </span>

            <span className="flex items-center gap-1.5 text-xs tabular-nums">
              <Heart className="h-3.5 w-3.5" strokeWidth={1.6} />
              {likes}
            </span>

            <span
              className={`${styles.mono} text-[10px] uppercase tracking-[0.2em]`}
              style={{ color: "var(--muted)" }}
            >
              {shortDate(story.createAt)}
            </span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={busy}
            className="gap-1.5"
          >
            <Trash2 className="h-3 w-3" strokeWidth={1.6} />
            TARK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
