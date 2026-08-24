"use client";

// ============================================================
//  CreateReelModal - reel-i nav (VIDEO).
//  POST /Reels/add-reels  (multipart/form-data)
//
//  QOIDAI SERVER (az swagger):
//    "Video" - HATMI. Be video reel sokhta NAMESHAVAD.
//    "Cover" - ikhtiyori (surati ruyi video).
//
//  Agar shumo faqat SURAT dored - onro ba "POST" gured, na ba REEL.
//
//  Video-i peshnamoish AZ KHUDI fayli korbar ast.
// ============================================================
import { useState } from "react";
import { FileVideo, ImagePlus, TriangleAlert, X } from "lucide-react";

import { addReel, errorText } from "../api";
import { useProfile } from "../providers";
import styles from "../profile.module.css";

import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

// Windows ba'ze vaqt namudi (type) faylro namedihad - kholi mefiristad.
// Baroi hamin ILOVATAN pasvandi faylro ham mesanjem.
const VIDEO_EXTENSIONS = [
  ".mp4",
  ".mov",
  ".m4v",
  ".webm",
  ".mkv",
  ".avi",
  ".3gp",
  ".mpeg",
  ".mpg",
];

function isVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;

  const name = file.name.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export default function CreateReelModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const { token, reload } = useProfile();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // ---------- Videoro intikhob kardan ----------
  function pickVideo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = ""; // ki ayni hamon faylro dubora giriftan shavad
    if (file === null) return;

    // Sanjishi ASOSI: in dar haqiqat video ast?
    if (!isVideoFile(file)) {
      setError(
        `"${file.name}" video nest. Reel faqat az VIDEO sokhta meshavad. ` +
          "Agar faqat surat dored - onro ba POST gured."
      );
      return;
    }

    // Adresi kuhnaro ozod mekunem (khotira behuda nagirad)
    if (videoUrl !== "") URL.revokeObjectURL(videoUrl);

    setVideo(file);
    setVideoUrl(URL.createObjectURL(file));
    setError("");
  }

  function removeVideo() {
    if (videoUrl !== "") URL.revokeObjectURL(videoUrl);
    setVideo(null);
    setVideoUrl("");
  }

  // ---------- Cover (ikhtiyori) ----------
  function pickCover(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (file === null) return;

    if (!file.type.startsWith("image/")) {
      setError(`"${file.name}" surat nest. Cover boyad SURAT bosad.`);
      return;
    }

    setCover(file);
    setError("");
  }

  // ---------- Formaro toza mekunem ----------
  function resetForm() {
    if (videoUrl !== "") URL.revokeObjectURL(videoUrl);

    setTitle("");
    setDescription("");
    setVideo(null);
    setVideoUrl("");
    setCover(null);
    setError("");
  }

  // Modal-ro faqat vaqte busy NEST bastan mumkin ast
  function handleOpenChange(next: boolean) {
    if (busy) return;
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (video === null) {
      setError("Avval VIDEO intikhob kuned - be on reel sokhta nameshavad.");
      return;
    }

    setBusy(true);

    try {
      await addReel(token, { title, description, video, cover });
      await reload();

      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError(errorText(err, "Reel guzoshta nashud."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>REEL-I NAV</DialogTitle>
          <DialogDescription>POST / REELS / ADD-REELS</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className={`${styles.scroll} max-h-[60vh] space-y-6 px-5 py-6`}>
            {/* KHATO dar BOLO - ki hamesha didan shavad */}
            {error !== "" && (
              <Alert variant="destructive" className={styles.snap}>
                <TriangleAlert
                  className="mt-0.5 h-4 w-4 shrink-0"
                  strokeWidth={1.6}
                />
                <span className="normal-case tracking-normal">{error}</span>
              </Alert>
            )}

            {/* ---------- 01 VIDEO (HATMI) ---------- */}
            <div className="space-y-3">
              <Label>01 / VIDEO — HATMI</Label>

              {video === null ? (
                <>
                  <label
                    className="flex cursor-pointer items-center justify-center gap-3 border border-dashed py-8 transition-colors duration-150"
                    style={{ borderColor: "var(--signal)" }}
                  >
                    <FileVideo className="h-5 w-5" strokeWidth={1.4} />
                    <span
                      className={`${styles.mono} text-[10px] uppercase tracking-[0.24em]`}
                    >
                      VIDEO INTIKHOB KUNED
                    </span>
                    <input
                      type="file"
                      // Windows ba'ze faylhoro bo "video/*" pinhon mekunad -
                      // baroi hamin pasvandhoro ham menavisem.
                      accept={`video/*,${VIDEO_EXTENSIONS.join(",")}`}
                      hidden
                      onChange={pickVideo}
                    />
                  </label>

                  <p
                    className={`${styles.mono} text-[9px] uppercase tracking-[0.18em]`}
                    style={{ color: "var(--muted)" }}
                  >
                    MP4 / MOV / WEBM ... — FAQAT SURAT KIFOYA NEST
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <div
                    className="flex items-center gap-3 border px-3 py-2.5"
                    style={{ borderColor: "var(--lineStrong)" }}
                  >
                    <FileVideo className="h-4 w-4 shrink-0" strokeWidth={1.4} />

                    <span className="min-w-0 flex-1 truncate text-xs">
                      {video.name}
                    </span>

                    <span
                      className={`${styles.mono} shrink-0 text-[10px] tracking-[0.14em]`}
                      style={{ color: "var(--muted)" }}
                    >
                      {(video.size / 1024 / 1024).toFixed(1)} MB
                    </span>

                    <button
                      type="button"
                      onClick={removeVideo}
                      aria-label="Videoro tark kuned"
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  </div>

                  <div
                    className={`${styles.cellTall} mx-auto max-w-[220px] border`}
                    style={{ borderColor: "var(--lineStrong)" }}
                  >
                    <video
                      src={videoUrl}
                      controls
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ---------- 02 COVER (IKHTIYORI) ---------- */}
            <div className="space-y-3">
              <Label>02 / SURATI RUYI VIDEO — IKHTIYORI</Label>

              <label
                className="flex cursor-pointer items-center justify-center gap-3 border border-dashed py-5 transition-colors duration-150 hover:border-[var(--signal)]"
                style={{ borderColor: "var(--lineStrong)" }}
              >
                <ImagePlus className="h-4 w-4 shrink-0" strokeWidth={1.4} />
                <span
                  className={`${styles.mono} max-w-[70%] truncate text-[10px] uppercase tracking-[0.24em]`}
                >
                  {cover === null ? "SURAT INTIKHOB KUNED" : cover.name}
                </span>
                <input type="file" accept="image/*" hidden onChange={pickCover} />
              </label>
            </div>

            {/* ---------- 03 SARLAVHA ---------- */}
            <div className="space-y-2">
              <Label htmlFor="reel-title">03 / SARLAVHA</Label>
              <Input
                id="reel-title"
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Sarlavhai reel"
              />
            </div>

            {/* ---------- 04 TAVSIF ---------- */}
            <div className="space-y-2">
              <Label htmlFor="reel-description">04 / TAVSIF</Label>
              <Textarea
                id="reel-description"
                rows={3}
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Dar borai in video..."
              />
            </div>
          </div>

          <DialogFooter>
            {/* Agar video nabosad - SABABRO menavisem */}
            {video === null && (
              <span
                className={`${styles.mono} mr-auto text-[9px] uppercase tracking-[0.18em]`}
                style={{ color: "var(--muted)" }}
              >
                VIDEO LOZIM AST
              </span>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={busy}
            >
              BEKOR
            </Button>

            <Button
              type="submit"
              size="sm"
              variant="signal"
              disabled={busy || video === null}
            >
              {busy ? "BOR KARDA ISTODAAST..." : "GUZOSHTAN"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
