"use client";

// ============================================================
//  VoiceRecorder - payomi OVOZI (golosovoy).
//
//  Dar swagger endpoint-i alohidai ovoz NEST, vale
//  PUT /Chat/send-message maidoni "File" dorad ->
//  ovozro hamchun FAYL mefiristem.
//
//  Nomi fayl "voice-....weba" ast - ba'dan az hamin nom
//  mefahmem ki in payomi ovozi ast (nigar: isAudioFile).
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Mic, Send, Trash2 } from "lucide-react";

import styles from "../chats.module.css";

type Props = {
  disabled: boolean;
  onReady: (file: File) => void; // ovoz tayyor -> firistodan
  onError: (message: string) => void;
};

// Kadom format-ro in browser dastgiri mekunad?
function pickMime(): { mime: string; ext: string } {
  const options: { mime: string; ext: string }[] = [
    { mime: "audio/webm;codecs=opus", ext: "weba" },
    { mime: "audio/ogg;codecs=opus", ext: "ogg" },
    { mime: "audio/webm", ext: "weba" },
    { mime: "audio/mp4", ext: "m4a" },
  ];

  if (typeof MediaRecorder === "undefined") return { mime: "", ext: "weba" };

  for (const option of options) {
    if (MediaRecorder.isTypeSupported(option.mime)) return option;
  }
  return { mime: "", ext: "weba" };
}

const MAX_SECONDS = 120; // 2 daqiqa - basta

export default function VoiceRecorder({ disabled, onReady, onError }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState<number[]>(new Array(14).fill(0.15));

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const raf = useRef<number | null>(null);
  const cancelled = useRef(false);

  // Hamaro tabdil mekunem (agar komponent basta shavad)
  useEffect(() => {
    return () => {
      if (timer.current !== null) clearInterval(timer.current);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      stream.current?.getTracks().forEach((track) => track.stop());
      void audioCtx.current?.close().catch(() => {});
    };
  }, []);

  function stopAll() {
    if (timer.current !== null) {
      clearInterval(timer.current);
      timer.current = null;
    }
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }

    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;

    void audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;

    setRecording(false);
    setSeconds(0);
    setLevel(new Array(14).fill(0.15));
  }

  // ---------- Oghozi navishtan ----------
  async function start() {
    if (disabled || recording) return;

    if (
      typeof navigator === "undefined" ||
      navigator.mediaDevices === undefined ||
      typeof MediaRecorder === "undefined"
    ) {
      onError("In browser navishtani ovozro dastgiri namekunad.");
      return;
    }

    try {
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      stream.current = mic;

      const { mime, ext } = pickMime();
      const node =
        mime === ""
          ? new MediaRecorder(mic)
          : new MediaRecorder(mic, { mimeType: mime });

      chunks.current = [];
      cancelled.current = false;

      node.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };

      node.onstop = () => {
        const type = node.mimeType || mime || "audio/webm";
        const blob = new Blob(chunks.current, { type });
        chunks.current = [];

        stopAll();

        if (cancelled.current) return;
        if (blob.size < 900) {
          onError("Ovoz khele kutoh ast - tugmaro dartar dored.");
          return;
        }

        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type });
        onReady(file);
      };

      node.start(200);
      recorder.current = node;
      setRecording(true);
      setSeconds(0);

      // Soat
      timer.current = setInterval(() => {
        setSeconds((old) => {
          const next = old + 1;
          if (next >= MAX_SECONDS) finish();
          return next;
        });
      }, 1000);

      // Mavjhoi ovoz (baroi zebo shudan)
      watchLevel(mic);
    } catch (err) {
      stopAll();
      onError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Ijozati mikrofon doda nashud."
          : "Mikrofon kushoda nashud."
      );
    }
  }

  // Balandii ovozro mekhonem -> mavjho
  function watchLevel(mic: MediaStream) {
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (Ctor === undefined) return;

      const ctx = new Ctor();
      audioCtx.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(mic).connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        analyser.getByteTimeDomainData(data);

        let peak = 0;
        for (const value of data) {
          peak = Math.max(peak, Math.abs(value - 128) / 128);
        }

        setLevel((old) => [...old.slice(1), Math.min(1, 0.15 + peak * 1.8)]);
        raf.current = requestAnimationFrame(loop);
      };

      raf.current = requestAnimationFrame(loop);
    } catch {
      // mavjho lozim nestand - bе onho ham kor mekunad
    }
  }

  // ---------- Tamom: firistodan ----------
  function finish() {
    cancelled.current = false;
    if (recorder.current !== null && recorder.current.state !== "inactive") {
      recorder.current.stop();
    } else {
      stopAll();
    }
  }

  // ---------- Tamom: tark kardan ----------
  function cancel() {
    cancelled.current = true;
    if (recorder.current !== null && recorder.current.state !== "inactive") {
      recorder.current.stop();
    } else {
      stopAll();
    }
  }

  if (!recording) {
    return (
      <button
        type="button"
        onClick={start}
        disabled={disabled}
        aria-label="Payomi ovozi navised"
        title="Payomi ovozi"
        className={styles.iconBtn}
      >
        <Mic className="h-5 w-5" strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <div className={styles.voiceLive}>
      <button
        type="button"
        onClick={cancel}
        aria-label="Tark kuned"
        className={styles.iconBtn}
        style={{ color: "var(--signal)" }}
      >
        <Trash2 className="h-5 w-5" strokeWidth={1.8} />
      </button>

      <span className={styles.voiceDot} aria-hidden />

      <span className={styles.voiceWave} aria-hidden>
        {level.map((value, index) => (
          <i key={index} style={{ transform: `scaleY(${value.toFixed(2)})` }} />
        ))}
      </span>

      <span className="tabular-nums text-[13px]" style={{ color: "var(--muted)" }}>
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </span>

      <button
        type="button"
        onClick={finish}
        aria-label="Ovozro firisted"
        className={styles.sendBtn}
      >
        <Send className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}
