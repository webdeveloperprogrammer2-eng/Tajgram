"use client";

// ============================================================
//  StoryViewer - namoishi story dar tamomi ekran.
//
//  Chi kor mekunad:
//   1. suratro kalon nishon medihad
//   2. ba server megu-yad "man didam"  -> POST /Story/add-story-view
//   3. hisobi didaho va like-ho az server nishon medihad
//   4. tugmai tark kardan (DELETE /Story/DeleteStory)
//   5. KHUDASH meguzarad - monandi instagram (poyontar bin)
// ============================================================
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Heart, Trash2, X } from "lucide-react";

import {
  ApiError,
  deleteStory,
  isVideoName,
  mediaUrl,
  viewStory,
  type Story,
} from "../api";
import { initials, shortDate } from "../format";
import { useProfile } from "../providers";
import styles from "../profile.module.css";
import { useT } from "@/components/LocaleProvider";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";

// Storyi SURATI chand vaqt namoyon memonad (instagram ~5s,
// mo 10s girift - talabi loyiha).
const PHOTO_MS = 10_000;

export default function StoryViewer({
  stories,
  index,
  onChangeIndex,
  onClose,
  title,
  canDelete = true,
  onRemove,
  removeLabel,
}: {
  stories: Story[];
  index: number | null;
  onChangeIndex: (next: number) => void;
  onClose: () => void;

  // ---------- Baroi "ACTUALNIY" (/Actual) ----------
  // Hamin yak component har du korro mekunad: ham storyhoi
  // 24-soata, ham to-plamhoi hameshagi. Farq faqat dar sarlavha
  // va dar amali tugmai poyon ast.

  /** Ba joi nomi korbar - nomi to-plam ("Safar", "Ta'til"). */
  title?: string;
  /** Dar profili korbari DIGAR tugmai tark umuman naboyad bosad. */
  canDelete?: boolean;
  /**
   * Agar doda shavad - ba joi TARK KARDANI story onro faqat
   * az to-plam mebarorad (DELETE /Actual/remove-story-from-actual).
   * Storyi asli dast narasida memonad.
   */
  onRemove?: (story: Story) => Promise<void>;
  removeLabel?: string;
}) {
  const { t } = useT();
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

  // ------------------------------------------------------------
  //  TAYMER - story boyad KHUDASH guzarad (monandi instagram)
  //
  //  Peshtar hech taymer nabud: surat TO ABAD dar ekran meistod
  //  va to on damе ki korbar "x"-ro nazanad, gum nameshud.
  //
  //  Hozir:
  //    SURAT -> 10 soniya, ba'd storyi oyanda (yo bastan)
  //    VIDEO -> to okhiri KHUDI video (davomnokii onro megirem)
  // ------------------------------------------------------------
  const isVideo = story !== null && isVideoName(story.fileName);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // "Ba oyanda guzashtan" daruni taymer lozim ast. Onro dar ref
  // nigoh medorem - vagarna har render taymerro az nav sar mekard
  // va story hech goh ba okhir namerasid.
  const advance = useRef<() => void>(() => {});

  useEffect(() => {
    advance.current = () => {
      if (index === null) return;
      if (index < stories.length - 1) onChangeIndex(index + 1);
      else onClose();
    };
  }, [index, stories.length, onChangeIndex, onClose]);

  // ---- SURAT: 10 soniya ----
  useEffect(() => {
    if (story === null || isVideo) return;

    queueMicrotask(() => setProgress(0));
    const startedAt = Date.now();

    const timer = setInterval(() => {
      const done = Math.min(1, (Date.now() - startedAt) / PHOTO_MS);
      setProgress(done);

      if (done >= 1) {
        clearInterval(timer);
        advance.current();
      }
    }, 60);

    return () => clearInterval(timer);
  }, [story?.id, isVideo, story]);

  // ---- VIDEO: az sar sar mekunem ----
  useEffect(() => {
    if (story === null || !isVideo) return;

    queueMicrotask(() => setProgress(0));

    const node = videoRef.current;
    if (node === null) return;

    node.currentTime = 0;

    // Bo sado sar mekunem. Agar browser ijozat nadihad (siyosati
    // autoplay), KHOMUSH mekunem va boz mesanjem - vagarna video
    // umuman kor namekard va story hech goh naguzasht.
    void node.play().catch(() => {
      node.muted = true;
      void node.play().catch(() => {});
    });
  }, [story?.id, isVideo, story]);

  if (story === null || index === null) return null;

  const src = mediaUrl(story.fileName);
  const avatar = mediaUrl(story.userAvatar) ?? mediaUrl(profile?.image);
  const userName = title ?? profile?.userName ?? "STORY";
  const views = story.viewerDto?.viewCount ?? 0;
  const likes = story.viewerDto?.viewLike ?? 0;

  // Storyi peshina / oyanda
  function goPrev() {
    if (index !== null && index > 0) onChangeIndex(index - 1);
  }

  function goNext() {
    if (index !== null && index < stories.length - 1) onChangeIndex(index + 1);
  }

  // Tugmai poyon: yo storyro TARK mekunad, yo faqat az
  // to-plam mebarorad (agar onRemove doda shuda bosad).
  async function handleDelete() {
    if (story === null) return;

    setBusy(true);

    try {
      if (onRemove !== undefined) {
        await onRemove(story);
      } else {
        await deleteStory(token, story.id);
        await reload();
      }
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
      {/* Ramkai oyna ba TAMOMI ekran meshavad - monandi instagram dar PK.
         Sabkho AYNAN dar style-and, chunki styles.modal (CSS module)
         paҳноии 440px va foni panel-ro talab mekunad. */}
      <DialogContent
        showClose={false}
        className="animate-fade-in"
        style={{
          width: "100vw",
          maxWidth: "none",
          height: "100dvh",
          padding: 0,
          border: 0,
          borderRadius: 0,
          background: "#1a1a1a",
          boxShadow: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <DialogTitle className="sr-only">{t.story}</DialogTitle>

        <DialogClose
          aria-label={t.close}
          className="absolute right-5 top-5 z-30 flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </DialogClose>

        {/* ---- Tirchahoi girdi safed BERUN az kort ---- */}
        {index > 0 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label={t.previous}
            className="absolute left-[calc(50%-min(28vh,220px)-56px)] top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#262626] shadow-md transition hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        {index < stories.length - 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label={t.next}
            className="absolute right-[calc(50%-min(28vh,220px)-56px)] top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#262626] shadow-md transition hover:scale-110 active:scale-95"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </button>
        )}

        {/* ================= KORTI ASOSI (9:16) ================= */}
        <div className="animate-scale-in relative flex aspect-[9/16] h-[calc(100dvh-90px)] max-h-[860px] flex-col overflow-hidden rounded-[6px] bg-black shadow-[0_10px_60px_rgba(0,0,0,0.5)]">
          {/* Pasazamina: hamon surat, kalonkarda va khira. Bе in,
             surathoi PAHN dar miyoni navorhoi siyoh meistodand. */}
          {src !== null && !isVideo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-3xl"
            />
          )}

          {src !== null &&
            (isVideo ? (
              <video
                ref={videoRef}
                src={src}
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full object-contain"
                onTimeUpdate={(event) => {
                  const node = event.currentTarget;
                  if (Number.isFinite(node.duration) && node.duration > 0) {
                    setProgress(Math.min(1, node.currentTime / node.duration));
                  }
                }}
                onEnded={() => advance.current()}
                onError={() => advance.current()}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={t.story}
                className="absolute inset-0 h-full w-full object-contain"
              />
            ))}

          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 via-black/25 to-transparent" />

          {/* ---------- Bolo: navorho + korbar ---------- */}
          <div className="absolute inset-x-0 top-0 z-10 px-2 pt-3">
            <div className="flex gap-[3px]">
              {stories.map((item, i) => (
                <span
                  key={item.id}
                  className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/35"
                >
                  <span
                    className="block h-full rounded-full bg-white"
                    style={{
                      width:
                        i < index
                          ? "100%"
                          : i === index
                            ? `${Math.round(progress * 100)}%`
                            : "0%",
                    }}
                  />
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-3 px-1">
              <span className={styles.ring}>
                <Avatar className="h-8 w-8 border-2 border-black">
                  {avatar !== null && <AvatarImage src={avatar} alt={userName} />}
                  <AvatarFallback className="text-[10px]">
                    {initials(userName)}
                  </AvatarFallback>
                </Avatar>
              </span>

              <p className="truncate text-[14px] font-semibold text-white">
                {userName}
              </p>
              <p className="shrink-0 text-[14px] text-white/70">
                {shortDate(story.createAt)}
              </p>
            </div>
          </div>

          {/* ---------- Poyon: hisobho va tark ---------- */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-t from-black/75 to-transparent px-4 pb-4 pt-10">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[13px] tabular-nums text-white backdrop-blur">
                <Eye className="h-4 w-4" strokeWidth={1.7} />
                {views}
              </span>

              <span className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[13px] tabular-nums text-white backdrop-blur">
                <Heart className="h-4 w-4" strokeWidth={1.7} />
                {likes}
              </span>

              <span className="text-[13px] tabular-nums text-white/60">
                {index + 1} / {stories.length}
              </span>
            </div>

            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={busy}
                className="gap-1.5 rounded-full bg-white/12 text-[#ff5a68] backdrop-blur hover:bg-white/20 hover:text-[#ff5a68]"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                {removeLabel ?? "TARK"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}