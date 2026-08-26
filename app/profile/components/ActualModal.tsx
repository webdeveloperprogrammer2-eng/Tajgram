"use client";

// ============================================================
//  ActualModal - sokhtani "ACTUALNIY"-i nav.
//
//  POST /Actual/add-actual  (multipart/form-data)
//    Title    - hatmi
//    StoryIds - raqamhoi story bo vergul: "12,15,18"
//    Cover    - ikhtiyori; agar naboshad, server storyi
//               AVVALRO muqova mekunad.
//
//  Monandi instagram: avval nom mepursad, ba'd storyhoro
//  intikhob mekuni, va ikhtiyori muqovai khudat.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus } from "lucide-react";

import {
  addActual,
  errorText,
  isVideoName,
  mediaUrl,
  type Story,
} from "../api";
import { toJpegFile } from "../toJpeg";
import { shortDate } from "../format";
import { useProfile } from "../providers";
import styles from "../profile.module.css";

import { useT } from "@/components/LocaleProvider";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const TITLE_LIMIT = 30;

export default function ActualModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreated: () => void;
}) {
  const { token, stories } = useProfile();
  const { t } = useT();

  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  // Fayl va adresi muvaqqatii on hamesha BA HAM meoyand,
  // baroi hamin dar YAK holat. (Pesh du holati judo bud va
  // adres daruni useEffect guzoshta meshud - React onro
  // "render-i zanjiri" hisob mekard.)
  const [cover, setCover] = useState<{ file: File; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const coverInput = useRef<HTMLInputElement>(null);

  // Har bor ki oyna kushoda meshavad - hama chizro az nav
  useEffect(() => {
    if (!open) return;

    queueMicrotask(() => {
      setTitle("");
      setPicked([]);
      setCover(null);
      setError("");
    });
  }, [open]);

  // Adresi muvaqqati (blob:) hofizaro band mekunad - ba'di
  // istifoda ONRO OZOD mekunem, vagarna memory leak meshavad.
  useEffect(() => {
    if (cover === null) return;
    return () => URL.revokeObjectURL(cover.url);
  }, [cover]);

  function toggleStory(id: number) {
    setPicked((old) =>
      old.includes(id) ? old.filter((item) => item !== id) : [...old, id],
    );
  }

  async function pickCover(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      // Server webp/avif/heic-ro qabul namekunad -> ba JPEG
      const jpeg = await toJpegFile(file);
      setCover({ file: jpeg, url: URL.createObjectURL(jpeg) });
    } catch {
      setError(t.highlightFailed);
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();

    const clean = title.trim();

    if (clean === "") {
      setError(t.highlightNeedTitle);
      return;
    }
    if (picked.length === 0) {
      setError(t.highlightNeedStory);
      return;
    }

    setError("");
    setBusy(true);

    try {
      await addActual(token, {
        title: clean,
        storyIds: picked,
        cover: cover?.file ?? null,
      });
      onCreated();
      onOpenChange(false);
    } catch (err) {
      setError(errorText(err, t.highlightFailed));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.newHighlight}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className={`${styles.scroll} flex-1`}>
          <div className="space-y-6 px-6 py-6">
            {/* ================= NOM + MUQOVA ================= */}
            <div className="flex items-end gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="actual-title">{t.highlightTitle}</Label>
                <Input
                  id="actual-title"
                  value={title}
                  maxLength={TITLE_LIMIT}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t.highlightTitlePlaceholder}
                  autoFocus
                />
              </div>

              {/* Muqova - ikhtiyori. Agar naguzori, server storyi
                  avvalro muqova mekunad. */}
              <div className="shrink-0 space-y-2">
                <Label>{t.highlightCover}</Label>
                <button
                  type="button"
                  onClick={() => coverInput.current?.click()}
                  className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors duration-200 hover:border-[var(--fg)]"
                  style={{ borderColor: "var(--lineStrong)" }}
                >
                  {cover !== null ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImagePlus
                      className="h-5 w-5"
                      strokeWidth={1.7}
                      style={{ color: "var(--muted)" }}
                    />
                  )}
                </button>

                <input
                  ref={coverInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={pickCover}
                />
              </div>
            </div>

            {/* ================= INTIKHOBI STORY ================= */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label>{t.highlightPickStories}</Label>
                {picked.length > 0 && (
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--muted)" }}
                  >
                    {t.highlightPicked}: {picked.length}
                  </span>
                )}
              </div>

              {stories.length === 0 ? (
                <p
                  className="py-8 text-center text-[13px]"
                  style={{ color: "var(--muted)" }}
                >
                  {t.highlightNoStories}
                </p>
              ) : (
                <div className="grid max-h-[240px] grid-cols-4 gap-2 overflow-y-auto">
                  {stories.map((story) => (
                    <StoryTile
                      key={story.id}
                      story={story}
                      picked={picked.includes(story.id)}
                      onToggle={() => toggleStory(story.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {error !== "" && (
              <p
                className={`${styles.snap} text-[13px]`}
                style={{ color: "var(--danger)" }}
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="h-8 rounded-lg px-4 text-[14px] font-semibold text-[var(--muted)] transition-colors duration-200 hover:bg-[var(--panel)] disabled:opacity-40"
            >
              {t.cancel}
            </button>

            <button
              type="submit"
              disabled={busy || stories.length === 0}
              className="h-8 rounded-lg bg-[#0095f6] px-4 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#1877f2] active:scale-[0.97] disabled:opacity-40"
            >
              {busy ? t.highlightCreating : t.highlightCreate}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
//  Yak storyi khurd bo nishonai "intikhob shud".
// ------------------------------------------------------------
function StoryTile({
  story,
  picked,
  onToggle,
}: {
  story: Story;
  picked: boolean;
  onToggle: () => void;
}) {
  const src = mediaUrl(story.fileName);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={picked}
      title={shortDate(story.createAt)}
      className="relative aspect-[9/16] overflow-hidden rounded-lg bg-[var(--panel)] transition-transform duration-150 active:scale-95"
      style={
        picked
          ? { outline: "2px solid #0095f6", outlineOffset: "-2px" }
          : undefined
      }
    >
      {src !== null &&
        (isVideoName(story.fileName) ? (
          <video
            src={src}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ))}

      {picked && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/40">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0095f6] text-white">
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
        </span>
      )}
    </button>
  );
}
