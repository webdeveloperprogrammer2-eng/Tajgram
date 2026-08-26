"use client";

// ============================================================
//  HighlightViewer - namoishi "ACTUALNIY"-i korbari DIGAR.
//
//  Faqat DIDAN: tugmai tark kardan in jo nest.
//  Navorhoi bolo (progress) monandi instagram - kadom story
//  az chandto.
//
//  DIQQAT: in component az @/lib kor mekunad, na az
//  app/profile/api.ts - chunki /profile/[userId] daruni
//  gurehi (app) ast va papkai profile-ro namebinad.
// ============================================================
import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

import { api, isVideo, mediaUrl } from "@/lib/api";
import type { ActualDetails } from "@/lib/types";
import { shortTimeAgo } from "@/lib/format";

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "../icons";
import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

export function HighlightViewer({
  actual,
  onClose,
}: {
  actual: ActualDetails | null;
  onClose: () => void;
}) {
  const { t } = useT();
  const [step, setStep] = useState(0);

  const total = actual?.stories.length ?? 0;
  const story = actual?.stories[step] ?? null;

  // To-plami nav -> az storyi avval sar mekunem
  useEffect(() => {
    queueMicrotask(() => setStep(0));
  }, [actual]);

  const next = useCallback(() => {
    setStep((current) => {
      // Storyi okhirin -> oynaro mebandem (monandi instagram)
      if (current >= total - 1) {
        onClose();
        return current;
      }
      return current + 1;
    });
  }, [total, onClose]);

  const prev = useCallback(() => {
    setStep((current) => (current > 0 ? current - 1 : current));
  }, []);

  // Ba server megu-yem "man didam" - yak bor baroi har story
  useEffect(() => {
    if (story === null) return;
    api.viewStory(story.id).catch(() => {});
  }, [story]);

  // Tugmahoi klaviatura: chap / rost / Esc
  useEffect(() => {
    if (actual === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
    };

    document.addEventListener("keydown", onKey);
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
    };
  }, [actual, onClose, next, prev]);

  if (actual === null || story === null) return null;

  const src = mediaUrl(story.fileName);
  const video = isVideo(story.fileName);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="animate-scale-in relative flex aspect-[9/16] max-h-[92dvh] w-full max-w-[420px] items-center justify-center overflow-hidden rounded-xl bg-black"
      >
        {src !== null &&
          (video ? (
            <video
              src={src}
              autoPlay
              playsInline
              controls
              onEnded={next}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={actual.title}
              className="max-h-full max-w-full object-contain"
            />
          ))}

        {/* ---------- Bolo: navorho + nomi to-plam ---------- */}
        <div className="absolute inset-x-0 top-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.7),transparent)] px-3 pt-3 pb-8">
          <div className="flex gap-1">
            {actual.stories.map((item, i) => (
              <span
                key={item.id}
                className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30"
              >
                <span
                  className={`block h-full rounded-full bg-white transition-all duration-200 ${
                    i <= step ? "w-full" : "w-0"
                  }`}
                />
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2.5">
            <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-white">
              {actual.title}
              <span className="ml-2 text-[12px] font-normal text-white/70">
                {shortTimeAgo(story.createAt)}
              </span>
            </p>

            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-200 hover:bg-white/20"
            >
              <CloseIcon size={20} />
            </button>
          </div>
        </div>

        {/* ---------- Tugmahoi chap va rost ---------- */}
        {step > 0 && (
          <button
            type="button"
            onClick={prev}
            aria-label={t.previous}
            className="absolute left-1 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white transition-colors duration-200 hover:bg-black/70"
          >
            <ChevronLeftIcon size={20} />
          </button>
        )}

        {step < total - 1 && (
          <button
            type="button"
            onClick={next}
            aria-label={t.next}
            className="absolute right-1 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white transition-colors duration-200 hover:bg-black/70"
          >
            <ChevronRightIcon size={20} />
          </button>
        )}

        {/* Raqami story */}
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 text-[12px] tabular-nums text-white">
          {step + 1} / {total}
        </span>
      </div>
    </div>,
    document.body,
  );
}
