"use client";

// ============================================================
//  HighlightsRow - "ACTUALNIY"-i korbari DIGAR (/profile/[userId]).
//
//  Faqat DIDAN: in jo na tugmai "+", na tark kardan hast -
//  aynan monandi instagram, ki dar profili kasi digar faqat
//  to-plamhoyash namoyon meshavand.
//
//  GET /Actual/get-actuals?UserId=...     -> ro-ykhati to-plamho
//  GET /Actual/get-actual-by-id?id=...    -> storyhoi yak to-plam
// ============================================================
import { useEffect, useState } from "react";

import { api, isVideo, mediaUrl } from "@/lib/api";
import type { Actual, ActualDetails } from "@/lib/types";

import { useT } from "../LocaleProvider";
import { HighlightViewer } from "./HighlightViewer";

export function HighlightsRow({ userId }: { userId: string }) {
  const { t } = useT();

  const [actuals, setActuals] = useState<Actual[]>([]);
  const [open, setOpen] = useState<ActualDetails | null>(null);

  useEffect(() => {
    if (userId === "") return;

    let alive = true;

    api
      .userActuals(userId)
      .then((response) => {
        if (alive) setActuals(response.data ?? []);
      })
      .catch(() => {
        // Be actualniy ham profil kor mekunad
        if (alive) setActuals([]);
      });

    return () => {
      alive = false;
    };
  }, [userId]);

  async function openActual(actual: Actual) {
    try {
      // Ro-ykhati kutoh storyhoro NAMEDIHAD - onhoro alohida megirem
      const response = await api.actualById(actual.actualId);
      const full = response.data;

      if (full !== null && (full.stories?.length ?? 0) > 0) setOpen(full);
    } catch {
      // Agar nashud - hech chiz namekushoem
    }
  }

  if (actuals.length === 0) return null;

  return (
    <section
      className="mt-6 border-b pb-2 md:mt-8"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-8 [&::-webkit-scrollbar]:hidden">
        {actuals.map((actual) => {
          const cover = mediaUrl(actual.coverImage);

          return (
            <div
              key={actual.actualId}
              className="flex w-[64px] shrink-0 flex-col items-center gap-1.5 md:w-[80px]"
            >
              <button
                type="button"
                onClick={() => void openActual(actual)}
                aria-label={actual.title}
                title={`${actual.title} - ${actual.storyCount}`}
                className="flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-full border bg-[var(--panel)] transition-transform duration-200 hover:scale-105 active:scale-95 md:h-[77px] md:w-[77px]"
                style={{ borderColor: "var(--line)" }}
              >
                {cover !== null &&
                  (isVideo(actual.coverImage) ? (
                    <video
                      src={cover}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ))}
              </button>

              <span className="w-full truncate text-center text-[12px]">
                {actual.title}
              </span>
            </div>
          );
        })}
      </div>

      <span className="sr-only">{t.highlights}</span>

      <HighlightViewer actual={open} onClose={() => setOpen(null)} />
    </section>
  );
}
