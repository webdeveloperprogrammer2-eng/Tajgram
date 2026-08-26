"use client";

// ============================================================
//  ReelCard - YAK video dar lenta (yak ekran).
//
//  Kor mekunad:
//    - vaqte video ba markazi ekran meoyad -> KHUDASH mebozad
//      (IntersectionObserver), digarho ist mekunand
//    - yak bor ki namoyon shud -> POST /Reels/view-reels
//    - dil -> POST /Reels/like-reels (du bor zadan ham like mekunad)
//    - zakladka -> POST /Reels/add-reels-favorite
//    - komment -> panel-i kommentho
//
//  Raqamho (like, prosmotr, komment) HAMA az server meoyand.
// ============================================================
import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  favoriteReel,
  likeReel,
  mediaUrl,
  viewReel,
  type Reel,
} from "../api";
import { initials, shortNumber, timeAgo } from "../format";
import { useReels } from "../providers";
import styles from "../reels.module.css";
import { useT } from "@/components/LocaleProvider";

export default function ReelCard({
  reel,
  onOpenComments,
}: {
  reel: Reel;
  onOpenComments: (reel: Reel) => void;
}) {
  const { token, muted, toggleMuted, patchReel } = useReels();
  const { t } = useT();

  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  const [playing, setPlaying] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const viewSent = useRef(false);
  const lastTap = useRef(0);

  const src = mediaUrl(reel.videoName);
  const cover = mediaUrl(reel.coverName);
  const avatar = mediaUrl(reel.userImage);

  // ---------- Vaqte video ba ekran meoyad - mebozad ----------
  useEffect(() => {
    const box = frame.current;
    const player = video.current;
    if (box === null || player === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry === undefined) return;

        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          player.play().then(
            () => setPlaying(true),
            () => setPlaying(false) // browser autoplay-ro band kard
          );

          // PROSMOTR - faqat YAK bor baroi har video
          if (!viewSent.current) {
            viewSent.current = true;
            viewReel(token, reel.reelsId)
              .then(() => {
                if (!reel.reelsView) {
                  patchReel(reel.reelsId, {
                    reelsView: true,
                    reelsViewCount: reel.reelsViewCount + 1,
                  });
                }
              })
              .catch(() => {
                // prosmotr chizi asosi nest - khomush meguzarem
              });
          }
        } else {
          player.pause();
          setPlaying(false);
        }
      },
      { threshold: [0, 0.6, 1] }
    );

    observer.observe(box);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, reel.reelsId]);

  // Sadọ: yak sozish baroi hamai videoho
  useEffect(() => {
    if (video.current !== null) video.current.muted = muted;
  }, [muted]);

  // ---------- LIKE ----------
  async function handleLike(fromDoubleTap: boolean) {
    // Agar du bor zad va alakay like bosad - faqat dilro nishon medihem
    if (fromDoubleTap && reel.reelsLike) {
      setShowHeart(true);
      return;
    }

    const liked = !reel.reelsLike;

    // Darhol dar ekran (ba'd server)
    patchReel(reel.reelsId, {
      reelsLike: liked,
      reelsLikeCount: reel.reelsLikeCount + (liked ? 1 : -1),
    });

    if (liked) setShowHeart(true);

    try {
      await likeReel(token, reel.reelsId);
    } catch {
      // Server qabul nakard -> ba holi peshina bar megardonem
      patchReel(reel.reelsId, {
        reelsLike: reel.reelsLike,
        reelsLikeCount: reel.reelsLikeCount,
      });
    }
  }

  // ---------- SAQLSHUDA ----------
  async function handleFavorite() {
    const saved = !reel.reelsFavorite;

    patchReel(reel.reelsId, {
      reelsFavorite: saved,
      reelsFavoriteCount: reel.reelsFavoriteCount + (saved ? 1 : -1),
    });

    try {
      await favoriteReel(token, reel.reelsId);
    } catch {
      patchReel(reel.reelsId, {
        reelsFavorite: reel.reelsFavorite,
        reelsFavoriteCount: reel.reelsFavoriteCount,
      });
    }
  }

  // Yak zadan = ist/boz, du zadan = like
  function handleTap() {
    const now = Date.now();

    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      handleLike(true);
      return;
    }

    lastTap.current = now;

    const player = video.current;
    if (player === null) return;

    if (player.paused) {
      player.play().then(
        () => setPlaying(true),
        () => setPlaying(false)
      );
    } else {
      player.pause();
      setPlaying(false);
    }
  }

  return (
    <div className={styles.slide}>
      <div className={styles.frame} ref={frame}>
        {/* ---------- VIDEO ---------- */}
        {src !== null && (
          <video
            ref={video}
            src={src}
            poster={cover ?? undefined}
            className={styles.video}
            loop
            muted={muted}
            playsInline
            preload="metadata"
            onClick={handleTap}
          />
        )}

        <span className={styles.scrim} aria-hidden />

        {/* ---------- Nishonai ist ---------- */}
        {!playing && (
          <span className={styles.muteBadge}>
            <Play className="h-6 w-6 fill-current" strokeWidth={0} />
          </span>
        )}

        {/* ---------- Dili kalon (du bor zadan) ---------- */}
        {showHeart && (
          <span
            className={styles.bigHeart}
            onAnimationEnd={() => setShowHeart(false)}
          >
            <Heart className="h-24 w-24 fill-current" strokeWidth={0} />
          </span>
        )}

        {/* ---------- Ma'lumot dar poyon ---------- */}
        <div className={styles.info}>
          <div className="flex items-center gap-2.5">
            <span className={styles.ring} style={{ height: 38, width: 38 }}>
              <span className={styles.ringInner} style={{ fontSize: 12 }}>
                {avatar !== null ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={reel.userName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  initials(reel.userName)
                )}
              </span>
            </span>

            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold">
                {reel.userName}
              </span>
              <span className="block text-[11px] opacity-70">
                {timeAgo(reel.datePublished)}
              </span>
            </span>
          </div>

          {reel.title !== null && reel.title !== "" && (
            <p className="mt-3 line-clamp-2 text-[14px] font-semibold">
              {reel.title}
            </p>
          )}

          {reel.description !== null && reel.description !== "" && (
            <p className="mt-1 line-clamp-2 text-[13px] opacity-85">
              {reel.description}
            </p>
          )}
        </div>

        {/* ---------- Tugmahoi tarafi rost ---------- */}
        <div className={styles.rail}>
          <button
            type="button"
            onClick={() => handleLike(false)}
            aria-label={t.likeAction}
            className={styles.railBtn}
          >
            <span
              className={`${styles.railIcon} ${
                reel.reelsLike ? styles.railIconOn : ""
              } ${reel.reelsLike ? styles.pulse : ""}`}
            >
              <Heart
                className={`h-5 w-5 ${reel.reelsLike ? "fill-current" : ""}`}
                strokeWidth={1.9}
              />
            </span>
            {shortNumber(reel.reelsLikeCount)}
          </button>

          <button
            type="button"
            onClick={() => onOpenComments(reel)}
            aria-label={t.comments}
            className={styles.railBtn}
          >
            <span className={styles.railIcon}>
              <MessageCircle className="h-5 w-5" strokeWidth={1.9} />
            </span>
            {shortNumber(reel.commentCount)}
          </button>

          <button
            type="button"
            onClick={handleFavorite}
            aria-label={t.saveAction}
            className={styles.railBtn}
          >
            <span
              className={`${styles.railIcon} ${
                reel.reelsFavorite ? styles.railIconOn : ""
              }`}
            >
              <Bookmark
                className={`h-5 w-5 ${reel.reelsFavorite ? "fill-current" : ""}`}
                strokeWidth={1.9}
              />
            </span>
            {shortNumber(reel.reelsFavoriteCount)}
          </button>

          <button
            type="button"
            onClick={toggleMuted}
            aria-label={t.sound}
            className={styles.railBtn}
          >
            <span className={styles.railIcon}>
              {muted ? (
                <VolumeX className="h-5 w-5" strokeWidth={1.9} />
              ) : (
                <Volume2 className="h-5 w-5" strokeWidth={1.9} />
              )}
            </span>
          </button>

          <span className={styles.railBtn}>
            <span className={styles.railIcon}>
              <Eye className="h-5 w-5" strokeWidth={1.9} />
            </span>
            {shortNumber(reel.reelsViewCount)}
          </span>

          <button
            type="button"
            onClick={handleTap}
            aria-label={playing ? t.pause : t.play}
            className={`${styles.railBtn} md:hidden`}
          >
            <span className={styles.railIcon}>
              {playing ? (
                <Pause className="h-5 w-5" strokeWidth={1.9} />
              ) : (
                <Play className="h-5 w-5" strokeWidth={1.9} />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
