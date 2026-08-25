"use client";

// ============================================================
//  app/chats/call/CallProvider.tsx
//  "Maghzi" zvanok: WebRTC + holati zvanok.
//
//  ROHI ZVANOK (ki chi mefiristad):
//    A: "ring"   ->  B      (dar B oynai "Zang meoyad" kushoda meshavad)
//    B: "accept" ->  A
//    A: "offer"  ->  B      (SDP)
//    B: "answer" ->  A      (SDP)
//    A <-> B: "ice"         (rohhoi shabaka)
//    har du:  "hangup" / "decline" / "busy"
//
//  Signaling az ./signaling.ts meoyad (BroadcastChannel yo WebSocket).
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Chat } from "../api";
import { useChats } from "../providers";
import {
  ICE_SERVERS,
  newCallId,
  sameId,
  Signaling,
  SIGNALING_URL,
  type CallMedia,
  type Signal,
  type SignalingStatus,
} from "./signaling";
import { Ringer } from "./ringtone";

export type CallPhase =
  | "idle" // zvanok nest
  | "outgoing" // man zang mezanam, sabr mekunam
  | "incoming" // ba man zang omad
  | "connecting" // qabul shud, ulanish soakhta meshavad
  | "active" // gap zada istodaem
  | "ended"; // tamom (2 soniya namoyon memonad)

export type CallPeer = {
  userId: string;
  userName: string;
  fullName: string;
  image: string | null;
  chatId: number;
};

type CallState = {
  phase: CallPhase;
  media: CallMedia;
  peer: CallPeer | null;

  micOff: boolean;
  camOff: boolean;

  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  startedAt: number | null; // vaqti ulanish (baroi soat)
  note: string; // sababi tamomshavi yo khato
  signalStatus: SignalingStatus;

  // ---------- REAL TIME baroi payomho ----------
  // Ba hamsuhbat mego-em: "payomi nav guzoshtam, az nav bikhon"
  notifyChat: (toUserId: string, chatId: number) => void;
  // Guş kardan: har bor ki hamsuhbat chize firistad, in sado medihad
  onChatEvent: (
    listener: (chatId: number, fromUserId: string) => void
  ) => () => void;

  // ---------- "PECHATAYET" ----------
  // Ba hamsuhbat mego-em: "man hozir navishta istodaam" / "bas kardam"
  notifyTyping: (toUserId: string, chatId: number, on: boolean) => void;
  // Gush kardan: hamsuhbat navishta istodaast yo ne
  onTypingEvent: (
    listener: (chatId: number, fromUserId: string, on: boolean) => void
  ) => () => void;

  callUser: (chat: Chat, media: CallMedia) => void;
  accept: () => void;
  decline: () => void;
  hangup: () => void;
  toggleMic: () => void;
  toggleCam: () => void;
};

const CallContext = createContext<CallState | null>(null);

const RING_TIMEOUT = 40_000; // 40 soniya sabr mekunem
const RING_REPEAT_MS = 2_500; // har chand vaqt "ring"-ro takror mefiristem

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { me } = useChats();

  const [phase, setPhase] = useState<CallPhase>("idle");
  const [media, setMedia] = useState<CallMedia>("audio");
  const [peer, setPeer] = useState<CallPeer | null>(null);

  const [micOff, setMicOff] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [signalStatus, setSignalStatus] = useState<SignalingStatus>("off");

  // ---------- Chizhoe ki render-ro ivaz namekunand ----------
  const hub = useRef<Signaling | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const local = useRef<MediaStream | null>(null);
  const callId = useRef<string>("");
  const peerRef = useRef<CallPeer | null>(null);
  const mediaRef = useRef<CallMedia>("audio");
  const phaseRef = useRef<CallPhase>("idle");
  const isCaller = useRef(false);
  const iceQueue = useRef<RTCIceCandidateInit[]>([]);
  const ringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // "ring"-ro takror mefiristem: agar hamsuhbat yak-du soniya
  // dertar sahifaro kusod, zang boz ham ba u merasad.
  const ringRepeat = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringer = useRef<Ringer | null>(null);

  // Onhoe ki payomhoi navro intizorand (ChatWindow, ChatsShell)
  const chatListeners = useRef(
    new Set<(chatId: number, fromUserId: string) => void>()
  );

  // Onhoe ki "pechatayet"-ro intizorand (ChatWindow)
  const typingListeners = useRef(
    new Set<(chatId: number, fromUserId: string, on: boolean) => void>()
  );

  const setPhaseSafe = useCallback((next: CallPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  // ------------------------------------------------------------
  //  Firistodani signal ba hamsuhbat
  // ------------------------------------------------------------
  const emit = useCallback(
    (kind: Signal["kind"], payload?: unknown, target?: CallPeer) => {
      const to = target ?? peerRef.current;
      if (hub.current === null || me === null || to === null) return;

      hub.current.send({
        kind,
        callId: callId.current,
        chatId: to.chatId,
        media: mediaRef.current,
        from: me.userId,
        fromName: me.fullName || me.userName,
        fromImage: me.image,
        to: to.userId,
        payload,
      });
    },
    [me]
  );

  // ------------------------------------------------------------
  //  Tozakuni: mikrofon/kamera khomush, ulanish basta
  // ------------------------------------------------------------
  const cleanup = useCallback(() => {
    if (ringTimer.current !== null) {
      clearTimeout(ringTimer.current);
      ringTimer.current = null;
    }
    if (ringRepeat.current !== null) {
      clearInterval(ringRepeat.current);
      ringRepeat.current = null;
    }

    ringer.current?.stop();

    local.current?.getTracks().forEach((track) => track.stop());
    local.current = null;
    setLocalStream(null);

    try {
      pc.current?.getSenders().forEach((sender) => sender.track?.stop());
      pc.current?.close();
    } catch {
      // guzoshtan
    }
    pc.current = null;

    setRemoteStream(null);
    iceQueue.current = [];
    setStartedAt(null);
    setMicOff(false);
    setCamOff(false);
  }, []);

  // Tamom kardan: sababro menavisem, 2 soniya namoyon, ba'd idle
  const finish = useCallback(
    (reason: string) => {
      if (phaseRef.current === "idle") return;

      cleanup();
      setNote(reason);
      setPhaseSafe("ended");

      if (endTimer.current !== null) clearTimeout(endTimer.current);
      endTimer.current = setTimeout(() => {
        setPhaseSafe("idle");
        setPeer(null);
        peerRef.current = null;
        callId.current = "";
        setNote("");
      }, 2200);
    },
    [cleanup, setPhaseSafe]
  );

  // ------------------------------------------------------------
  //  Soakhtani RTCPeerConnection
  // ------------------------------------------------------------
  const buildPeerConnection = useCallback(() => {
    const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    connection.onicecandidate = (event) => {
      if (event.candidate !== null) emit("ice", event.candidate.toJSON());
    };

    connection.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      setRemoteStream(stream);
    };

    connection.onconnectionstatechange = () => {
      const state = connection.connectionState;

      if (state === "connected") {
        ringer.current?.stop();
        if (ringTimer.current !== null) {
          clearTimeout(ringTimer.current);
          ringTimer.current = null;
        }
        setStartedAt((old) => old ?? Date.now());
        setPhaseSafe("active");
      }

      if (state === "failed") {
        finish("Ulanish nashud (shabaka band ast).");
      }

      if (state === "disconnected" || state === "closed") {
        if (phaseRef.current === "active") finish("Ulanish qat' shud.");
      }
    };

    pc.current = connection;
    return connection;
  }, [emit, finish, setPhaseSafe]);

  // Mikrofon/kamera pursidan
  const openDevices = useCallback(async (kind: CallMedia) => {
    if (
      typeof navigator === "undefined" ||
      navigator.mediaDevices === undefined
    ) {
      throw new Error("In browser mikrofon/kameraro dastgiri namekunad.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video:
        kind === "video"
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
    });

    local.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // ------------------------------------------------------------
  //  REAL TIME: khabar dodan ki payomi nav guzoshtam
  //  (bе in, tarafi digar to obnovit nakunad chize nameбinad)
  // ------------------------------------------------------------
  const notifyChat = useCallback(
    (toUserId: string, chatId: number) => {
      if (hub.current === null || me === null) return;
      if (toUserId === "" || sameId(toUserId, me.userId)) return;

      hub.current.send({
        kind: "chat",
        callId: `chat-${chatId}`, // in signal ba zvanok robita nadorad
        chatId,
        media: "audio",
        from: me.userId,
        fromName: me.fullName || me.userName,
        fromImage: me.image,
        to: toUserId,
      });
    },
    [me]
  );

  const onChatEvent = useCallback(
    (listener: (chatId: number, fromUserId: string) => void) => {
      chatListeners.current.add(listener);
      return () => {
        chatListeners.current.delete(listener);
      };
    },
    []
  );

  // ------------------------------------------------------------
  //  "PECHATAYET": hamsuhbat mebinad ki man navishta istodaam
  // ------------------------------------------------------------
  const notifyTyping = useCallback(
    (toUserId: string, chatId: number, on: boolean) => {
      if (hub.current === null || me === null) return;
      if (toUserId === "" || sameId(toUserId, me.userId)) return;

      hub.current.send({
        kind: "typing",
        callId: `typing-${chatId}`, // ba zvanok robita nadorad
        chatId,
        media: "audio",
        from: me.userId,
        fromName: me.fullName || me.userName,
        fromImage: me.image,
        to: toUserId,
        payload: { on },
      });
    },
    [me]
  );

  const onTypingEvent = useCallback(
    (listener: (chatId: number, fromUserId: string, on: boolean) => void) => {
      typingListeners.current.add(listener);
      return () => {
        typingListeners.current.delete(listener);
      };
    },
    []
  );

  // ------------------------------------------------------------
  //  1) MAN zang mezanam
  // ------------------------------------------------------------
  const callUser = useCallback(
    (chat: Chat, kind: CallMedia) => {
      if (phaseRef.current !== "idle" && phaseRef.current !== "ended") return;
      if (me === null || hub.current === null) return;

      const target: CallPeer = {
        userId: chat.userId,
        userName: chat.userName,
        fullName: chat.fullName,
        image: chat.userImage,
        chatId: chat.chatId,
      };

      callId.current = newCallId();
      peerRef.current = target;
      mediaRef.current = kind;
      isCaller.current = true;
      iceQueue.current = [];

      setPeer(target);
      setMedia(kind);
      setNote("");
      setPhaseSafe("outgoing");

      emit("ring", null, target);
      ringer.current?.play("outgoing");

      // TAKROR: har 2.5 soniya boz "ring" mefiristem to javob nagirem.
      // Yak so-rov metavonad gum shavad, yo hamsuhbat mumkin ast
      // aynan hozir saytro kusoda bosad - hamin takror onro megirad.
      // Tarafi digar ba HAMON callId du bor javob namedihad.
      if (ringRepeat.current !== null) clearInterval(ringRepeat.current);
      ringRepeat.current = setInterval(() => {
        if (phaseRef.current !== "outgoing") return;
        emit("ring", null, target);
      }, RING_REPEAT_MS);

      ringTimer.current = setTimeout(() => {
        emit("hangup");
        finish("Javob nadodand.");
      }, RING_TIMEOUT);
    },
    [emit, finish, me, setPhaseSafe]
  );

  // ------------------------------------------------------------
  //  2) Zangi omadaro QABUL mekunam
  // ------------------------------------------------------------
  const accept = useCallback(async () => {
    if (phaseRef.current !== "incoming") return;

    ringer.current?.stop();
    if (ringTimer.current !== null) {
      clearTimeout(ringTimer.current);
      ringTimer.current = null;
    }

    setPhaseSafe("connecting");

    try {
      const stream = await openDevices(mediaRef.current);
      const connection = buildPeerConnection();
      stream.getTracks().forEach((track) => connection.addTrack(track, stream));

      // "accept" mefiristem -> tarafi digar offer mesozad
      emit("accept");
    } catch (err) {
      emit("decline");
      finish(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Ijozati mikrofon/kamera doda nashud."
          : "Mikrofon yo kamera kushoda nashud."
      );
    }
  }, [buildPeerConnection, emit, finish, openDevices, setPhaseSafe]);

  const decline = useCallback(() => {
    emit("decline");
    finish("Zvanok rad shud.");
  }, [emit, finish]);

  const hangup = useCallback(() => {
    emit("hangup");
    finish("Zvanok tamom shud.");
  }, [emit, finish]);

  // ------------------------------------------------------------
  //  Mikrofon / kamera khomush - darginron
  // ------------------------------------------------------------
  const toggleMic = useCallback(() => {
    const stream = local.current;
    if (stream === null) return;

    const next = !micOff;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMicOff(next);
  }, [micOff]);

  const toggleCam = useCallback(() => {
    const stream = local.current;
    if (stream === null) return;

    const next = !camOff;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !next;
    });
    setCamOff(next);
  }, [camOff]);

  // ------------------------------------------------------------
  //  Gush kardani signalhoi daromada
  // ------------------------------------------------------------
  useEffect(() => {
    if (me === null) return;

    const signaling = new Signaling(me.userId);
    hub.current = signaling;
    ringer.current = new Ringer();

    // Holati signaling ba'di render meguzorem (na daruni khudi effect)
    queueMicrotask(() => setSignalStatus(signaling.status));

    const timer = setInterval(() => setSignalStatus(signaling.status), 3000);

    const off = signaling.on(async (signal) => {
      // --- PAYOMI NAV (real time) - pesh az hama ---
      if (signal.kind === "chat") {
        for (const listener of chatListeners.current) {
          listener(signal.chatId, signal.from);
        }
        return;
      }

      // --- "PECHATAYET" ---
      if (signal.kind === "typing") {
        const on = (signal.payload as { on?: boolean } | null)?.on === true;
        for (const listener of typingListeners.current) {
          listener(signal.chatId, signal.from, on);
        }
        return;
      }

      // --- Zangi nav ---
      if (signal.kind === "ring") {
        // Takrori HAMON zvanok (zangzananda har 2.5s mefiristad) -
        // in "band budan" NEST, faqat guzoshtan.
        if (signal.callId === callId.current && phaseRef.current !== "idle") {
          return;
        }

        if (phaseRef.current !== "idle") {
          // Man band hastam
          signaling.send({
            kind: "busy",
            callId: signal.callId,
            chatId: signal.chatId,
            media: signal.media,
            from: me.userId,
            fromName: me.fullName || me.userName,
            fromImage: me.image,
            to: signal.from,
          });
          return;
        }

        callId.current = signal.callId;
        mediaRef.current = signal.media;
        isCaller.current = false;
        iceQueue.current = [];

        const from: CallPeer = {
          userId: signal.from,
          userName: signal.fromName,
          fullName: signal.fromName,
          image: signal.fromImage,
          chatId: signal.chatId,
        };
        peerRef.current = from;

        setPeer(from);
        setMedia(signal.media);
        setNote("");
        setPhaseSafe("incoming");

        ringer.current?.play("incoming");

        ringTimer.current = setTimeout(() => {
          finish("Zvanoki nagirifta.");
        }, RING_TIMEOUT);

        return;
      }

      // Az in jo poyon - faqat signalhoi HAMIN zvanok
      if (signal.callId !== callId.current) return;

      if (signal.kind === "busy") {
        finish("Korbar band ast.");
        return;
      }

      if (signal.kind === "decline") {
        finish("Zvanok qabul nashud.");
        return;
      }

      if (signal.kind === "hangup") {
        finish("Hamsuhbat zvanokro tamom kard.");
        return;
      }

      // --- Tarafi digar qabul kard -> MAN offer mesozam ---
      if (signal.kind === "accept" && isCaller.current) {
        ringer.current?.stop();
        if (ringRepeat.current !== null) {
          clearInterval(ringRepeat.current);
          ringRepeat.current = null;
        }
        if (ringTimer.current !== null) {
          clearTimeout(ringTimer.current);
          ringTimer.current = null;
        }
        setPhaseSafe("connecting");

        try {
          const stream = await openDevices(mediaRef.current);
          const connection = buildPeerConnection();
          stream
            .getTracks()
            .forEach((track) => connection.addTrack(track, stream));

          const offer = await connection.createOffer();
          await connection.setLocalDescription(offer);
          emit("offer", offer);
        } catch (err) {
          emit("hangup");
          finish(
            err instanceof Error && err.name === "NotAllowedError"
              ? "Ijozati mikrofon/kamera doda nashud."
              : "Mikrofon yo kamera kushoda nashud."
          );
        }
        return;
      }

      // --- Offer omad (man qabulkunanda hastam) ---
      if (signal.kind === "offer" && !isCaller.current) {
        const connection = pc.current ?? buildPeerConnection();

        try {
          await connection.setRemoteDescription(
            new RTCSessionDescription(
              signal.payload as RTCSessionDescriptionInit
            )
          );

          for (const candidate of iceQueue.current) {
            await connection.addIceCandidate(candidate).catch(() => {});
          }
          iceQueue.current = [];

          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          emit("answer", answer);
        } catch {
          emit("hangup");
          finish("Ulanish soakhta nashud.");
        }
        return;
      }

      // --- Answer omad (man zangzananda hastam) ---
      if (signal.kind === "answer" && isCaller.current) {
        const connection = pc.current;
        if (connection === null) return;

        try {
          await connection.setRemoteDescription(
            new RTCSessionDescription(
              signal.payload as RTCSessionDescriptionInit
            )
          );
          for (const candidate of iceQueue.current) {
            await connection.addIceCandidate(candidate).catch(() => {});
          }
          iceQueue.current = [];
        } catch {
          finish("Ulanish soakhta nashud.");
        }
        return;
      }

      // --- ICE ---
      if (signal.kind === "ice") {
        const candidate = signal.payload as RTCIceCandidateInit;
        const connection = pc.current;

        if (connection === null || connection.remoteDescription === null) {
          iceQueue.current.push(candidate);
          return;
        }
        await connection.addIceCandidate(candidate).catch(() => {});
      }
    });

    return () => {
      clearInterval(timer);
      off();
      signaling.close();
      hub.current = null;
      ringer.current?.dispose();
      ringer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.userId]);

  // Agar sahifa basta shavad - hamsuhbatro ogoh mekunem
  useEffect(() => {
    function onLeave() {
      if (phaseRef.current !== "idle" && phaseRef.current !== "ended") {
        emit("hangup");
      }
      cleanup();
    }

    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [cleanup, emit]);

  const value = useMemo<CallState>(
    () => ({
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
      notifyChat,
      onChatEvent,
      notifyTyping,
      onTypingEvent,
      callUser,
      accept,
      decline,
      hangup,
      toggleMic,
      toggleCam,
    }),
    [
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
      notifyChat,
      onChatEvent,
      notifyTyping,
      onTypingEvent,
      callUser,
      accept,
      decline,
      hangup,
      toggleMic,
      toggleCam,
    ]
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall(): CallState {
  const value = useContext(CallContext);
  if (value === null) {
    throw new Error("useCall faqat daruni <CallProvider> kor mekunad");
  }
  return value;
}

export { SIGNALING_URL };
