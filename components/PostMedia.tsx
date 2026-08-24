"use client";

import { useRef, useState } from "react";
import { isVideo, mediaUrl } from "@/lib/api";
import { ImageIcon, PlayIcon, SoundIcon } from "./icons";

/**
 * Один слайд поста: картинка или видео. Файл может быть недоступен,
 * поэтому есть заглушка на случай ошибки загрузки.
 */
export function PostMedia({
  fileName,
  alt,
  className = "",
  zoom = false,
}: {
  fileName: string | null;
  alt: string;
  className?: string;
  zoom?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const url = mediaUrl(fileName);

  if (!url || broken) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,#fbfbfb,#f2f2f2)] text-[#c7c7c7] ${className}`}
      >
        <ImageIcon size={40} className="animate-fade-in" />
        <span className="text-[11px] text-[#a8a8a8]">Media unavailable</span>
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
      <div className={`relative h-full w-full bg-black ${className}`}>
        <video
          ref={videoRef}
          src={url}
          className={`h-full w-full object-cover transition-opacity duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          loop
          muted={muted}
          playsInline
          onClick={toggle}
          onLoadedData={() => setLoaded(true)}
          onError={() => setBroken(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            playing ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white/85 pl-1 text-[#262626] shadow-lg backdrop-blur-sm transition-transform duration-300 hover:scale-110 active:scale-95">
            <PlayIcon size={26} />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMuted((value) => !value)}
          aria-label={muted ? "Unmute" : "Mute"}
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className={`h-full w-full object-cover transition-all duration-700 ease-out ${
          loaded ? "scale-100 opacity-100 blur-0" : "scale-105 opacity-0 blur-sm"
        } ${zoom ? "group-hover/media:scale-[1.03]" : ""} ${className}`}
        onLoad={() => setLoaded(true)}
        onError={() => setBroken(true)}
      />
    </>
  );
}
