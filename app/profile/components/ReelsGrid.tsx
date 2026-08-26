"use client";

// ============================================================
//  ReelsGrid - turi VIDEOHOI (reels) man.
//
//  Monandi instagram: khonaho AMUDI (9:16), hisobi PROSMOTR
//  hamesha dar kunji poyoni chap meistad, va hangomi hover
//  like ham namoyon meshavad.
//
//  Har du raqam az server meoyand (GET /Reels/get-my-reels).
// ============================================================
import { useState } from "react";
import { Clapperboard, Heart, Play } from "lucide-react";

import { mediaUrl, type Reel } from "../api";
import { shortNumber } from "../format";

import { ProfileEmpty, ProfileGrid } from "@/components/profile/ProfileTabs";

import { useT } from "@/components/LocaleProvider";

import ReelModal from "./ReelModal";

export default function ReelsGrid({ reels }: { reels: Reel[] }) {
  const [openReel, setOpenReel] = useState<Reel | null>(null);
  const { t } = useT();

  if (reels.length === 0) {
    return (
      <ProfileEmpty
        icon={<Clapperboard className="h-7 w-7" strokeWidth={1.6} />}
        title={t.noReelsYet}
        text={t.reelsEmptyText}
      />
    );
  }

  return (
    <>
      <ProfileGrid>
        {reels.map((reel) => {
          const cover = mediaUrl(reel.coverName);
          const video = mediaUrl(reel.videoName);

          return (
            <button
              key={reel.reelsId}
              type="button"
              onClick={() => setOpenReel(reel)}
              className="group relative aspect-[9/16] overflow-hidden bg-[var(--panel)]"
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

              {/* Raqami prosmotr - hamesha namoyon, monandi instagram */}
              <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 text-[13px] font-semibold tabular-nums text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
                <Play className="h-4 w-4 fill-current" strokeWidth={0} />
                {shortNumber(reel.reelsViewCount)}
              </span>

              {/* Hangomi hover - like ham namoyon meshavad */}
              <span className="pointer-events-none absolute inset-0 hidden items-center justify-center gap-7 bg-black/35 text-[15px] font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Heart className="h-5 w-5 fill-current" strokeWidth={0} />
                  {shortNumber(reel.reelsLikeCount)}
                </span>

                <span className="flex items-center gap-1.5 tabular-nums">
                  <Play className="h-5 w-5 fill-current" strokeWidth={0} />
                  {shortNumber(reel.reelsViewCount)}
                </span>
              </span>
            </button>
          );
        })}
      </ProfileGrid>

      <ReelModal reel={openReel} onClose={() => setOpenReel(null)} />
    </>
  );
}
