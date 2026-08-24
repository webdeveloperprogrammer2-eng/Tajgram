"use client";

// ============================================================
//  PhotoSwiper - swiper-i tarafi chap.
//  10 surat, khudash avtomati ivaz meshavad (5 soniya).
//  3D: surati kuhna ba chuqurii sahna meravad va charkh mezanad.
//  Bo mush kashidan (drag), tugmaho va klaviatura ham kor mekunad.
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SLIDES, photoUrl } from "../slides";
import { useSettings } from "../providers";
import type { Dict } from "../i18n";
import styles from "../auth.module.css";

import BrandMark from "./BrandMark";

const DELAY = 5000; // 5 soniya baroi har surat

export default function PhotoSwiper() {
  const { t } = useSettings();

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1); // 1 = pesh, -1 = aqib
  const [paused, setPaused] = useState(false);

  // Kadom suratho tayyor shudand (ki narm namoyon shavand)
  const [loaded, setLoaded] = useState<number[]>([]);

  // Baroi 3D: mush dar kujost (az -1 to 1)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Joyi ki angusht/mush kashidanro shuru' kard
  const dragStart = useRef<number | null>(null);

  // ---- Guzashtan ba surati digar ----
  const go = useCallback((step: 1 | -1) => {
    setDirection(step);
    setIndex((old) => (old + step + SLIDES.length) % SLIDES.length);
  }, []);

  // ---- Avtomati: har 5 soniya ----
  useEffect(() => {
    if (paused) return;

    const timer = setTimeout(() => go(1), DELAY);
    return () => clearTimeout(timer); // toza mekunem
  }, [index, paused, go]);

  // ---- Surati OYANDA-ro pesh az vaqt bor mekunem ----
  //      ki hangomi guzashtan safedi/siyohi nabosad
  useEffect(() => {
    const next = (index + 1) % SLIDES.length;
    const img = new Image();
    img.src = photoUrl(SLIDES[next].id);
  }, [index]);

  // ---- Tugmahoi klaviatura ----
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // ---- Kashidan bo mush / angusht ----
  function onPointerDown(event: React.PointerEvent) {
    dragStart.current = event.clientX;
    setPaused(true);
  }

  function onPointerUp(event: React.PointerEvent) {
    if (dragStart.current !== null) {
      const moved = event.clientX - dragStart.current;

      // Agar beshtar az 60px kashida bosad - surat ivaz meshavad
      if (moved < -60) go(1);
      if (moved > 60) go(-1);
    }

    dragStart.current = null;
    setPaused(false);
  }

  // ---- Mush harakat kard -> sahna kam kaj meshavad (3D) ----
  function onPointerMove(event: React.PointerEvent) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    setTilt({ x, y });
  }

  return (
    <div
      className={`${styles.stage} group relative hidden h-full w-full select-none overflow-hidden bg-black lg:block`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        dragStart.current = null;
        setPaused(false);
        setTilt({ x: 0, y: 0 });
      }}
      onPointerMove={onPointerMove}
    >
      {/* -------- SURATHO -------- */}
      <div
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{
          // 3D: sahna baroi mush kam mecharkhad
          transform: `rotateY(${tilt.x * 4}deg) rotateX(${-tilt.y * 3}deg) scale(1.04)`,
          transformStyle: "preserve-3d",
        }}
      >
        {SLIDES.map((slide, i) => {
          const isActive = i === index;
          const isLoaded = loaded.includes(i);

          // Suratho ki faol nestand - ba kujo raftaand?
          const outClass =
            direction === 1 ? styles.slideOutLeft : styles.slideOutRight;

          return (
            <div
              key={slide.id}
              className={`${styles.slide} ${isActive ? styles.slideActive : outClass}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                // key ivaz meshavad -> Ken Burns az nav shuru' meshavad
                key={isActive ? `on-${index}` : "off"}
                src={photoUrl(slide.id)}
                alt=""
                draggable={false}
                loading={i < 2 ? "eager" : "lazy"}
                onLoad={() =>
                  setLoaded((old) => (old.includes(i) ? old : [...old, i]))
                }
                className={`h-full w-full object-cover transition-opacity duration-700 ${
                  isLoaded ? "opacity-100" : "opacity-0"
                } ${isActive ? styles.kenburns : ""}`}
              />
            </div>
          );
        })}
      </div>

      {/* -------- Torikii rui surat (ki matn khonda shavad) -------- */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* -------- BOLO: logo-i 3D + 2 kalima -------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-12 xl:p-16">
        <BrandMark />
      </div>

      {/* -------- Tugmahoi pesh/aqib (hangomi mush namoyon meshavand) -------- */}
      <div className="absolute right-12 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 xl:right-16">
        {[
          { step: -1 as const, label: t.prevPhoto, Icon: ChevronLeft },
          { step: 1 as const, label: t.nextPhoto, Icon: ChevronRight },
        ].map(({ step, label, Icon }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={() => go(step)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/25 text-white/80 backdrop-blur-sm transition-colors hover:border-white/70 hover:text-white"
          >
            <Icon className="h-4 w-4" strokeWidth={1.5} />
          </button>
        ))}
      </div>

      {/* -------- POYON: matn + khathoi peshraft -------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-12 xl:p-16">
        {/* key={index} -> matn har bor az nav namoyon meshavad */}
        <div key={index} className={styles.captionIn}>
          <p className="text-[11px] uppercase tracking-[0.34em] text-white/55">
            {String(index + 1).padStart(2, "0")} / {SLIDES.length}
          </p>

          <p
            className={`${styles.display} mt-3 text-white`}
            style={{ fontSize: "clamp(1.6rem, 2.6vw, 2.4rem)" }}
          >
            {t[SLIDES[index].caption as keyof Dict]}
          </p>
        </div>

        {/* Khathoi peshraft - misli story dar Instagram */}
        <div className="mt-8 flex gap-2">
          {SLIDES.map((slide, i) => (
            <span
              key={slide.id}
              className="h-[2px] flex-1 overflow-hidden bg-white/25"
            >
              <span
                // key -> animatsiya az nav shuru' meshavad
                key={`${index}-${i}`}
                className={`block h-full w-full bg-white ${
                  i === index ? styles.barFill : ""
                }`}
                style={{
                  animationDuration: `${DELAY}ms`,
                  animationPlayState: paused ? "paused" : "running",
                  transform: i < index ? "scaleX(1)" : undefined,
                  opacity: i > index ? 0 : 1,
                }}
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
