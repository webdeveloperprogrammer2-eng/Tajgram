"use client";

import { useRef, useState } from "react";
import { isVideo, mediaUrl } from "@/lib/api";
import { ImageIcon, PlayIcon, SoundIcon } from "./icons";
import { useT } from "./LocaleProvider";

/**
 * Один слайд поста: картинка или видео. Файл может быть недоступен,
 * поэтому есть заглушка на случай ошибки загрузки.
 */
export function PostMedia({
  fileName,
  alt,
  className = "",
  zoom = false,
  onRatio,
}: {
  fileName: string | null;
  alt: string;
  className?: string;
  zoom?: boolean;
  /** Nisbati tabi'ii media (bar / balandi) - to qutti khudro moslonad. */
  onRatio?: (ratio: number) => void;
}) {
  const { t } = useT();
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const url = mediaUrl(fileName);

  if (!url || broken) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--panel)] text-[var(--muted)] ${className}`}
      >
        <ImageIcon size={40} className="animate-fade-in" />
        <span className="text-[11px] text-[#a8a8a8]">{t.mediaUnavailable}</span>
      </div>
    );
  }

  if (isVideo(fileName)) {
    const toggle = () => {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        void video.play();
        setPlaying(true);
      } else {
        video.pause();
        setPlaying(false);
      }
    };

    return (
      <div className={`relative h-full w-full overflow-hidden bg-black ${className}`}>
        {/* Foni khira - to dar tarafho navori siyohi murda namonad */}
        <video
          src={url}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
          muted
          playsInline
        />

        <video
          ref={videoRef}
          src={url}
          className={`relative h-full w-full object-contain transition-opacity duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          loop
          muted={muted}
          playsInline
          onClick={toggle}
          onLoadedData={(event) => {
            const el = event.currentTarget;
            if (el.videoWidth > 0 && el.videoHeight > 0) {
              onRatio?.(el.videoWidth / el.videoHeight);
            }
            setLoaded(true);
          }}
          onError={() => setBroken(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t.pause : t.play}
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            playing ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[var(--bg)]/85 pl-1 text-[var(--fg)] shadow-lg backdrop-blur-sm transition-transform duration-300 hover:scale-110 active:scale-95">
            <PlayIcon size={26} />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMuted((value) => !value)}
          aria-label={muted ? t.unmute : t.mute}
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform duration-200 hover:scale-110 active:scale-90"
        >
          <SoundIcon size={15} muted={muted} />
        </button>
      </div>
    );
  }

  return (
    <>
      {!loaded && <span className="skeleton absolute inset-0" />}

      {/* Foni khira: hamon surat, kalonkarda va khira. Bе in dar
          suratkhoi pahn/amudi navorhoi siyohi murda memonand. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        aria-hidden
        className={`pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-2xl transition-opacity duration-700 ${
          loaded ? "opacity-45" : "opacity-0"
        }`}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className={`relative h-full w-full object-contain transition-all duration-700 ease-out ${
          loaded ? "scale-100 opacity-100 blur-0" : "scale-105 opacity-0 blur-sm"
        } ${zoom ? "group-hover/media:scale-[1.03]" : ""} ${className}`}
        onLoad={(event) => {
          const el = event.currentTarget;
          if (el.naturalWidth > 0 && el.naturalHeight > 0) {
            onRatio?.(el.naturalWidth / el.naturalHeight);
          }
          setLoaded(true);
        }}
        onError={() => setBroken(true)}
      />
    </>
  );
}
