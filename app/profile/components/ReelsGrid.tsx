"use client";

// ============================================================
//  ReelsGrid - turi VIDEOHOI (reels) man.
//  In qism dar POYONTARI profil ast - monandi instagram.
//
//  ASOSI: vaqte mush ba boloi video meravad ->
//  PROSMOTR (viewCount) va LIKE (likeCount) namoyon meshavand.
//  Har du raqam az server meoyand (GET /Reels/get-my-reels).
// ============================================================
import { useState } from "react";
import { Eye, Heart, Play } from "lucide-react";

import { mediaUrl, type Reel } from "../api";
import { shortNumber } from "../format";
import styles from "../profile.module.css";

import ReelModal from "./ReelModal";

export default function ReelsGrid({ reels }: { reels: Reel[] }) {
  const [openReel, setOpenReel] = useState<Reel | null>(null);

  if (reels.length === 0) {
    return (
      <p
        className="py-24 text-center text-[13px]"
        style={{ color: "var(--muted)" }}
      >
        Hanuz video nest
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 py-2 sm:gap-3 sm:py-3">
        {reels.map((reel) => {
          const cover = mediaUrl(reel.coverName);
          const video = mediaUrl(reel.videoName);

          return (
            <button
              key={reel.reelsId}
              type="button"
              onClick={() => setOpenReel(reel)}
              className={styles.cellTall}
            >
              {/* Agar server surati ruyi video dihad - onro nishon medihem.
                  Agar nadihad - khudi videoro bo preload="metadata"
                  (faqat kadri avval, be bor kardani hamai video). */}
              {cover !== null ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={reel.title ?? "Reel"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                video !== null && (
                  <video
                    src={video}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                )
              )}

              {/* Nishonai "video" */}
              <span className="absolute right-2 top-2 text-white drop-shadow">
                <Play className="h-4 w-4 fill-current" strokeWidth={0} />
              </span>

              {/* Raqamho hamesha dar poyon - monandi instagram */}
              <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 text-xs tabular-nums text-white drop-shadow">
                <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                {shortNumber(reel.reelsViewCount)}
              </span>

              {/* Hangomi hover - har du raqam kalon */}
              <span className={styles.cellOverlay}>
                <span className="flex items-center gap-1.5 text-xs tabular-nums">
                  <Eye className="h-4 w-4" strokeWidth={1.6} />
                  {shortNumber(reel.reelsViewCount)}
                </span>

                <span className="flex items-center gap-1.5 text-xs tabular-nums">
                  <Heart className="h-4 w-4" strokeWidth={1.6} />
                  {shortNumber(reel.reelsLikeCount)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <ReelModal reel={openReel} onClose={() => setOpenReel(null)} />
    </>
  );
}
