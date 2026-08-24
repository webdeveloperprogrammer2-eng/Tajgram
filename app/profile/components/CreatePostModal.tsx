"use client";

// ============================================================
//  CreatePostModal - posti nav.
//  POST /Post/add-post  (multipart/form-data)
//  Az swagger: maidoni "Images" HATMI ast - kam az kam 1 surat.
//
//  Peshnamoish (preview) az KHUDI fayli intikhobkardai korbar
//  soakhta meshavad (URL.createObjectURL) - na az joi digar.
// ============================================================
import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { addPost, errorText } from "../api";
import { toJpegFile } from "../toJpeg";
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

export default function CreatePostModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const { token, reload } = useProfile();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Baroi har fayl yak adresi muvaqqati mesozem
  // va ba'di istifoda ONRO OZOD mekunem (memory leak nashavad).
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [files]);

  // Vaqte modal basta meshavad - hama chizro toza mekunem
  useEffect(() => {
    if (open) return;

    setTitle("");
    setContent("");
    setFiles([]);
    setError("");
  }, [open]);

  function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (picked.length === 0) return;
    setFiles((old) => [...old, ...picked].slice(0, 10)); // haddi aksar 10
  }

  function removeFile(index: number) {
    setFiles((old) => old.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (files.length === 0) {
      setError("Kam az kam YAK surat lozim ast.");
      return;
    }

    setBusy(true);

    try {
      // Server ba'ze namudi surat-ro qabul namekunad -> ba JPEG meguzaronem
      const images = await Promise.all(files.map((item) => toJpegFile(item)));

      await addPost(token, { title, content, images });

      // Ma'lumotro az server az nav megirem (postCount ham nav meshavad)
      await reload();
      onOpenChange(false);
    } catch (err) {
      setError(errorText(err, "Post guzoshta nashud."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={busy ? () => {} : onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>POSTI NAV</DialogTitle>
          <DialogDescription>POST / POST / ADD-POST</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className={`${styles.scroll} max-h-[60vh] space-y-6 px-5 py-6`}>
            {/* ---------- SURATHO ---------- */}
            <div className="space-y-3">
              <Label>01 / SURATHO (HATMI)</Label>

              <label
                className="flex cursor-pointer items-center justify-center gap-3 border border-dashed py-8 transition-colors duration-150 hover:border-[var(--signal)]"
                style={{ borderColor: "var(--lineStrong)" }}
              >
                <ImagePlus className="h-5 w-5" strokeWidth={1.4} />
                <span
                  className={`${styles.mono} text-[10px] uppercase tracking-[0.24em]`}
                >
                  SURAT INTIKHOB KUNED
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handlePick}
                />
              </label>

              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {previews.map((url, index) => (
                    <div key={url} className={styles.cell}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Surat ${index + 1}`}
                        className="h-full w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        aria-label="Suratro tark kuned"
                        className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center"
                        style={{
                          background: "var(--invBg)",
                          color: "var(--invFg)",
                        }}
                      >
                        <X className="h-3 w-3" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ---------- SARLAVHA ---------- */}
            <div className="space-y-2">
              <Label htmlFor="post-title">02 / SARLAVHA</Label>
              <Input
                id="post-title"
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Sarlavhai post"
              />
            </div>

            {/* ---------- MATN ---------- */}
            <div className="space-y-2">
              <Label htmlFor="post-content">03 / MATN</Label>
              <Textarea
                id="post-content"
                rows={3}
                maxLength={500}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Dar borai in post..."
              />
            </div>

            {error !== "" && (
              <Alert variant="destructive" className={styles.snap}>
                {error}
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              BEKOR
            </Button>

            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "BOR KARDA ISTODAAST..." : "GUZOSHTAN"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
