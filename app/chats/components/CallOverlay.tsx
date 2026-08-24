"use client";

// ============================================================
//  CallOverlay - oynai zvanok (audio va video).
//  Ba tamomi ekran kushoda meshavad va dar HAMAI sahifahoi
//  /chats kor mekunad (dar ChatsShell guzoshta shudaast).
// ============================================================

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useCall } from "../call/CallProvider";
import styles from "../chats.module.css";

import Avatar from "./Avatar";

export default function CallOverlay() {
  const {
    phase,
    media,
    peer,
    micOff,
    camOff,
    localStream,
    remoteStream,
    startedAt,
    note,
    signalStatus,
    accept,
    decline,
    hangup,
    toggleMic,
    toggleCam,
  } = useCall();

  const remoteVideo = useRef<HTMLVideoElement>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);

  // ---------- Soati zvanok ----------
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;

    const tick = () =>
      setSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));

    queueMicrotask(tick);
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  // ---------- Sadoi hamsuhbat ----------
  useEffect(() => {
    const node = remoteAudio.current;
    if (node === null) return;

    node.srcObject = remoteStream;
    if (remoteStream !== null) void node.play().catch(() => {});
  }, [remoteStream]);

  // ---------- Videohoi du taraf ----------
  useEffect(() => {
    const node = remoteVideo.current;
    if (node === null) return;

    node.srcObject = remoteStream;
    if (remoteStream !== null) void node.play().catch(() => {});
  }, [remoteStream, phase]);

  useEffect(() => {
    const node = localVideo.current;
    if (node === null) return;

    node.srcObject = localStream;
    if (localStream !== null) void node.play().catch(() => {});
  }, [localStream, phase]);

  if (phase === "idle" || peer === null) return null;

  const video = media === "video";
  const hasRemoteVideo =
    remoteStream !== null &&
    remoteStream.getVideoTracks().some((track) => track.enabled);

  const title = peer.fullName || peer.userName;

  const status =
    phase === "outgoing"
      ? "Zang meravad..."
      : phase === "incoming"
        ? video
          ? "Zvanoki video"
          : "Zvanoki sadoi"
        : phase === "connecting"
          ? "Ulanish soakhta meshavad..."
          : phase === "active"
            ? clock(startedAt === null ? 0 : seconds)
            : note;

  return (
    <div className={styles.callRoot} role="dialog" aria-label="Zvanok">
      {/* Sadoi hamsuhbat - hamesha (ham baroi audio, ham video) */}
      <audio ref={remoteAudio} autoPlay playsInline hidden />

      {/* ---------- Video-i hamsuhbat (paszamina) ---------- */}
      {video && (
        <video
          ref={remoteVideo}
          autoPlay
          playsInline
          className={`${styles.callRemote} ${hasRemoteVideo ? "" : styles.callHidden}`}
        />
      )}

      {/* ---------- Agar video nest - avatari kalon ---------- */}
      {(!video || !hasRemoteVideo) && (
        <div className={styles.callCenter}>
          <span className={styles.callHalo} aria-hidden />

          <span
            className={
              phase === "outgoing" || phase === "incoming" ? styles.callPulse : ""
            }
          >
            <Avatar image={peer.image} name={title} size={132} ring />
          </span>

          <p className="mt-6 text-center text-[22px] font-semibold">{title}</p>
          <p
            className="mt-1 text-center text-[14px]"
            style={{ color: "var(--muted)" }}
          >
            {status}
          </p>
        </div>
      )}

      {/* ---------- Sarlavha (dar rejimi video) ---------- */}
      {video && hasRemoteVideo && (
        <div className={styles.callTopBar}>
          <p className="text-[16px] font-semibold">{title}</p>
          <p className="text-[12px]" style={{ opacity: 0.75 }}>
            {status}
          </p>
        </div>
      )}

      {/* ---------- Video-i KHUDAM (kunji rost) ---------- */}
      {video && localStream !== null && (
        <div className={styles.callSelf}>
          <video
            ref={localVideo}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${camOff ? "opacity-0" : ""}`}
          />
          {camOff && (
            <span className={styles.callSelfOff}>
              <VideoOff className="h-5 w-5" strokeWidth={1.8} />
            </span>
          )}
        </div>
      )}

      {/* ---------- Holati signaling ---------- */}
      <div className={styles.callSignal}>
        {signalStatus === "online" ? (
          <>
            <Wifi className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Server-i zvanok</span>
          </>
        ) : signalStatus === "local" ? (
          <>
            <WifiOff className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Rejimi mahalli (yak browser)</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Signaling nest</span>
          </>
        )}
      </div>

      {/* ---------- Tugmaho ---------- */}
      <div className={styles.callBar}>
        {phase === "incoming" ? (
          <>
            <button
              type="button"
              onClick={decline}
              aria-label="Rad kardan"
              className={`${styles.callBtn} ${styles.callBtnEnd}`}
            >
              <PhoneOff className="h-6 w-6" strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={accept}
              aria-label="Qabul kardan"
              className={`${styles.callBtn} ${styles.callBtnPick}`}
            >
              {video ? (
                <Video className="h-6 w-6" strokeWidth={2} />
              ) : (
                <Phone className="h-6 w-6" strokeWidth={2} />
              )}
            </button>
          </>
        ) : phase === "ended" ? (
          <p className="text-[14px]" style={{ color: "var(--muted)" }}>
            {note}
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleMic}
              aria-label={micOff ? "Mikrofonro darginron" : "Mikrofonro khomush kuned"}
              className={`${styles.callBtn} ${micOff ? styles.callBtnOff : ""}`}
              disabled={localStream === null}
            >
              {micOff ? (
                <MicOff className="h-5 w-5" strokeWidth={1.9} />
              ) : (
                <Mic className="h-5 w-5" strokeWidth={1.9} />
              )}
            </button>

            {video && (
              <button
                type="button"
                onClick={toggleCam}
                aria-label={camOff ? "Kameraro darginron" : "Kameraro khomush kuned"}
                className={`${styles.callBtn} ${camOff ? styles.callBtnOff : ""}`}
                disabled={localStream === null}
              >
                {camOff ? (
                  <VideoOff className="h-5 w-5" strokeWidth={1.9} />
                ) : (
                  <Video className="h-5 w-5" strokeWidth={1.9} />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={hangup}
              aria-label="Zvanokro tamom kuned"
              className={`${styles.callBtn} ${styles.callBtnEnd}`}
            >
              <PhoneOff className="h-6 w-6" strokeWidth={2} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// 65 -> "01:05"
function clock(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${pad(hours)}:${pad(minutes % 60)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}
