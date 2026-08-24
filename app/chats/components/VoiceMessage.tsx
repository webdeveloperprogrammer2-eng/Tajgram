"use client";

// ============================================================
//  VoiceMessage - navozandai payomi ovozi daruni "bubble".
//  Play/pause + navori vaqt + sur'at (1x / 1.5x / 2x).
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import styles from "../chats.module.css";

const SPEEDS = [1, 1.5, 2];

export default function VoiceMessage({ src }: { src: string }) {
  const audio = useRef<HTMLAudioElement>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);

  // Ba'ze browserho tuli faylro darhol namedonand (Infinity)
  useEffect(() => {
    const node = audio.current;
    if (node === null) return;

    const onMeta = () => {
      if (Number.isFinite(node.duration)) setTotal(node.duration);
    };
    const onTime = () => setCurrent(node.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
      node.currentTime = 0;
    };

    node.addEventListener("loadedmetadata", onMeta);
    node.addEventListener("durationchange", onMeta);
    node.addEventListener("timeupdate", onTime);
    node.addEventListener("ended", onEnd);

    return () => {
      node.removeEventListener("loadedmetadata", onMeta);
      node.removeEventListener("durationchange", onMeta);
      node.removeEventListener("timeupdate", onTime);
      node.removeEventListener("ended", onEnd);
    };
  }, []);

  function toggle() {
    const node = audio.current;
    if (node === null) return;

    if (playing) {
      node.pause();
      setPlaying(false);
      return;
    }

    node.playbackRate = SPEEDS[speedIndex];
    void node
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }

  function seek(event: React.MouseEvent<HTMLDivElement>) {
    const node = audio.current;
    if (node === null || total <= 0) return;

    const box = event.currentTarget.getBoundingClientRect();
    const part = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));

    node.currentTime = part * total;
    setCurrent(node.currentTime);
  }

  function nextSpeed() {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);

    const node = audio.current;
    if (node !== null) node.playbackRate = SPEEDS[next];
  }

  const part = total > 0 ? Math.min(1, current / total) : 0;

  return (
    <div className={styles.voicePlayer}>
      <audio ref={audio} src={src} preload="metadata" />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Istoned" : "Guş kuned"}
        className={styles.voicePlay}
      >
        {playing ? (
          <Pause className="h-4 w-4" strokeWidth={2.2} />
        ) : (
          <Play className="h-4 w-4" strokeWidth={2.2} />
        )}
      </button>

      <div className={styles.voiceTrack} onClick={seek} role="presentation">
        <span
          className={styles.voiceFill}
          style={{ width: `${(part * 100).toFixed(1)}%` }}
        />
        <span
          className={styles.voiceHead}
          style={{ left: `${(part * 100).toFixed(1)}%` }}
        />
      </div>

      <span className="tabular-nums text-[11px]" style={{ opacity: 0.75 }}>
        {clock(playing || current > 0 ? current : total)}
      </span>

      <button
        type="button"
        onClick={nextSpeed}
        aria-label="Sur'ati navokhtan"
        className={styles.voiceSpeed}
      >
        {SPEEDS[speedIndex]}x
      </button>
    </div>
  );
}

function clock(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0:00";

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
