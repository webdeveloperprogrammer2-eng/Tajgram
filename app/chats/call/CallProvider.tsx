"use client";

// ============================================================
//  app/chats/call/CallProvider.tsx
//  "Maghzi" zvanok: WebRTC + holati zvanok.
//
//  ================== CHI IVAZ SHUD ==================
//  Peshtar in jo yak signaling-i KHUDSOKHTA istifoda meshud:
//  app/chats/signal/route.ts (long polling, khotirai protsessi
//  Next) + BroadcastChannel. On dar YAK browser kor mekard va
//  dar YAK protsessi server - vale bayni DU DASTGOH qariyan
//  hech goh. Baroi hamin "zang meravad..." menavisht va
//  ba tarafi digar HECH CHIZ namerasid.
//
//  Hozir hama chiz az BACKEND-I HAQIQI meguzarad:
//    - lifecycle: /Call/start-call, answer-call, decline-call,
//                 end-call            (./callApi.ts)
//    - SDP/ICE:   WebSocket /realtime (./realtime.ts)
//    - STUN/TURN: /Call/get-ice-servers yo hamon chize ki
//                 daruni "call:incoming" meoyad
//
//  ROHI ZVANOK:
//    A: POST start-call        -> backend ba B "call:incoming"
//    A: call:offer   (SDP)     -> B
//    B: POST answer-call       -> backend ba A khabar medihad
//    B: call:answer  (SDP)     -> A
//    A <-> B: call:ice-candidate
//    har du: POST end-call / decline-call
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
  answerCall,
  declineCall,
  endCall,
  FALLBACK_ICE,
  getIceServers,
  startCall,
  type CallRecord,
  type CallType,
} from "./callApi";
import {
  Realtime,
  sameId,
  type RealtimeMessage,
  type RealtimeStatus,
} from "./realtime";
import { Ringer } from "./ringtone";
import { tr } from "@/components/appLang";

export type CallMedia = CallType;

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
  signalStatus: RealtimeStatus;

  // ---------- REAL TIME baroi payomho ----------
  // DIQQAT: hozir backend KHUDASH ba giranda "chat:message"
  // mefiristad (hangomi send-message). Baroi hamin notifyChat
  // digar chize nafiristad - faqat baroi hamon jo-hoe monda,
  // ki onro sado mekunand.
  notifyChat: (toUserId: string, chatId: number) => void;
  onChatEvent: (
    listener: (chatId: number, fromUserId: string) => void
  ) => () => void;

  // ---------- "PECHATAYET" ----------
  notifyTyping: (toUserId: string, chatId: number, on: boolean) => void;
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

const RING_TIMEOUT = 45_000; // chand vaqt zang mezanem
const END_VIEW_MS = 2_400; // "tamom shud" chand vaqt namoyon memonad

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { me, token } = useChats();

  const [phase, setPhase] = useState<CallPhase>("idle");
  const [media, setMedia] = useState<CallMedia>("audio");
  const [peer, setPeer] = useState<CallPeer | null>(null);

  const [micOff, setMicOff] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [signalStatus, setSignalStatus] = useState<RealtimeStatus>("off");

  // ---------- Chizhoe ki render-ro ivaz namekunand ----------
  const hub = useRef<Realtime | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const local = useRef<MediaStream | null>(null);

  const callId = useRef<number | null>(null);
  const peerRef = useRef<CallPeer | null>(null);
  const mediaRef = useRef<CallMedia>("audio");
  const phaseRef = useRef<CallPhase>("idle");
  const isCaller = useRef(false);
  const tokenRef = useRef(token);

  const iceServers = useRef<RTCIceServer[]>(FALLBACK_ICE);
  const iceQueue = useRef<RTCIceCandidateInit[]>([]);
  // Offer metavonad PESH az on rasad, ki korbar "qabul"-ro pahş kunad
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);

  const ringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringer = useRef<Ringer | null>(null);

  const chatListeners = useRef(
    new Set<(chatId: number, fromUserId: string) => void>()
  );
  const typingListeners = useRef(
    new Set<(chatId: number, fromUserId: string, on: boolean) => void>()
  );

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const setPhaseSafe = useCallback((next: CallPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    hub.current?.send(event, data);
  }, []);

  // ------------------------------------------------------------
  //  Tozakuni: mikrofon/kamera khomush, ulanish basta
  // ------------------------------------------------------------
  const cleanup = useCallback(() => {
    if (ringTimer.current !== null) {
      clearTimeout(ringTimer.current);
      ringTimer.current = null;
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
    pendingOffer.current = null;
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
        endTimer.current = null;
        setPhaseSafe("idle");
        setPeer(null);
        peerRef.current = null;
        callId.current = null;
        isCaller.current = false;
        setNote("");
      }, END_VIEW_MS);
    },
    [cleanup, setPhaseSafe]
  );

  // Zvanoki peshina hanuz "ended"-ro nishon medihad? Taymerashro
  // mekushem - be in, ba'di 2 soniya zvanoki NAV khomush meshud.
  const clearEndTimer = useCallback(() => {
    if (endTimer.current !== null) {
      clearTimeout(endTimer.current);
      endTimer.current = null;
    }
  }, []);

  // "Zvanokro tamom kun" daruni RTCPeerConnection lozim ast, vale
  // on poyontar e'lon meshavad -> az rohi ref megirem.
  const hangupRef = useRef<(reason: string) => Promise<void>>(async () => {});

  // ------------------------------------------------------------
  //  RTCPeerConnection
  // ------------------------------------------------------------
  const buildPeerConnection = useCallback(() => {
    const connection = new RTCPeerConnection({
      iceServers: iceServers.current,
    });

    connection.onicecandidate = (event) => {
      if (event.candidate === null || callId.current === null) return;
      emit("call:ice-candidate", {
        callId: callId.current,
        candidate: event.candidate.toJSON(),
      });
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
        void hangupRef.current("Ulanish nashud (shabaka band ast).");
      }

      if (state === "disconnected" || state === "closed") {
        if (phaseRef.current === "active") {
          void hangupRef.current("Ulanish qat' shud.");
        }
      }
    };

    pc.current = connection;
    return connection;
  }, [emit, setPhaseSafe]);

  // Mikrofon/kamera pursidan
  const openDevices = useCallback(async (kind: CallMedia) => {
    if (
      typeof navigator === "undefined" ||
      navigator.mediaDevices === undefined
    ) {
      throw new Error(tr().micCamUnsupported);
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

  const deviceError = (err: unknown) =>
    err instanceof Error && err.name === "NotAllowedError"
      ? tr().micCamDenied
      : tr().mediaFailed;

  const stopCall = useCallback(
    async (reason: string) => {
      const id = callId.current;
      finish(reason);

      if (id !== null) {
        try {
          await endCall(tokenRef.current, id, reason);
        } catch {
          // zvanok dar har hol dar in taraf tamom shud
        }
      }
    },
    [finish]
  );

  useEffect(() => {
    hangupRef.current = stopCall;
  }, [stopCall]);

  // ------------------------------------------------------------
  //  1) MAN zang mezanam
  // ------------------------------------------------------------
  const callUser = useCallback(
    (chat: Chat, kind: CallMedia) => {
      if (phaseRef.current !== "idle" && phaseRef.current !== "ended") return;
      if (me === null) return;

      clearEndTimer();

      const target: CallPeer = {
        userId: chat.userId,
        userName: chat.userName,
        fullName: chat.fullName,
        image: chat.userImage,
        chatId: chat.chatId,
      };

      // Adresi hamsuhbat nodurust ast? (get-chats gohe ID-i KHUDI
      // moro medihad). Be in sanjish signal ba khudam meraft.
      if (target.userId.trim() === "" || sameId(target.userId, me.userId)) {
        setPeer(target);
        peerRef.current = null;
        setMedia(kind);
        setNote(tr().peerNotFound);
        setPhaseSafe("ended");
        endTimer.current = setTimeout(() => {
          endTimer.current = null;
          setPhaseSafe("idle");
          setPeer(null);
          setNote("");
        }, END_VIEW_MS);
        return;
      }

      peerRef.current = target;
      mediaRef.current = kind;
      isCaller.current = true;
      iceQueue.current = [];
      pendingOffer.current = null;
      callId.current = null;

      setPeer(target);
      setMedia(kind);
      setNote("");
      setPhaseSafe("outgoing");
      ringer.current?.play("outgoing");

      void (async () => {
        try {
          // ---- 1. Ba backend mego-em: "zvanokro kusho" ----
          const record = await startCall(
            tokenRef.current,
            target.userId,
            kind
          );

          if (phaseRef.current !== "outgoing") return; // qat' karda shud

          callId.current = record.callId;

          // Backend khudash mego-ed ki tarafi digar onlayn nest
          if (record.status === "missed" || record.isPeerOnline === false) {
            finish(tr().userOffline);
            return;
          }

          // ---- 2. STUN/TURN ----
          iceServers.current =
            record.iceServers && record.iceServers.length > 0
              ? record.iceServers
              : await getIceServers(tokenRef.current).catch(() => FALLBACK_ICE);
          if (iceServers.current.length === 0) {
            iceServers.current = FALLBACK_ICE;
          }

          // ---- 3. Mikrofon/kamera + offer ----
          const stream = await openDevices(kind);
          if (phaseRef.current !== "outgoing") {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          const connection = buildPeerConnection();
          stream
            .getTracks()
            .forEach((track) => connection.addTrack(track, stream));

          const offer = await connection.createOffer();
          await connection.setLocalDescription(offer);
          emit("call:offer", { callId: record.callId, sdp: offer });

          // ---- 4. Chand vaqt zang mezanem ----
          ringTimer.current = setTimeout(() => {
            void stopCall(tr().noAnswer);
          }, RING_TIMEOUT);
        } catch (err) {
          const text =
            err instanceof Error && err.name === "NotAllowedError"
              ? deviceError(err)
              : err instanceof Error && err.message !== ""
                ? err.message
                : tr().callFailed;
          void stopCall(text);
        }
      })();
    },
    [
      buildPeerConnection,
      clearEndTimer,
      emit,
      finish,
      me,
      openDevices,
      setPhaseSafe,
      stopCall,
    ]
  );

  // ------------------------------------------------------------
  //  2) Zangi omadaro QABUL mekunam
  // ------------------------------------------------------------
  const accept = useCallback(async () => {
    if (phaseRef.current !== "incoming") return;
    const id = callId.current;
    if (id === null) return;

    ringer.current?.stop();
    if (ringTimer.current !== null) {
      clearTimeout(ringTimer.current);
      ringTimer.current = null;
    }

    setPhaseSafe("connecting");

    try {
      // Ba backend: "qabul kardam" (u ba zangzananda khabar medihad)
      await answerCall(tokenRef.current, id);

      const stream = await openDevices(mediaRef.current);
      const connection = pc.current ?? buildPeerConnection();
      stream.getTracks().forEach((track) => connection.addTrack(track, stream));

      // Offer allakay omadaast? -> hozir javob mesozem.
      // Naomadaast? -> vaqte oyad, hamin kor dar handler mesavad.
      const offer = pendingOffer.current;
      if (offer !== null) {
        pendingOffer.current = null;
        await connection.setRemoteDescription(new RTCSessionDescription(offer));

        for (const candidate of iceQueue.current) {
          await connection.addIceCandidate(candidate).catch(() => {});
        }
        iceQueue.current = [];

        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        emit("call:answer", { callId: id, sdp: answer });
      }
    } catch (err) {
      try {
        await declineCall(tokenRef.current, id);
      } catch {
        // guzoshtan
      }
      finish(deviceError(err));
    }
  }, [buildPeerConnection, emit, finish, openDevices, setPhaseSafe]);

  const decline = useCallback(() => {
    const id = callId.current;
    finish("Zvanok rad shud.");
    if (id !== null) void declineCall(tokenRef.current, id).catch(() => {});
  }, [finish]);

  const hangup = useCallback(() => {
    void stopCall("Zvanok tamom shud.");
  }, [stopCall]);

  // ------------------------------------------------------------
  //  Mikrofon / kamera
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
  //  Payomhoi zinda (WebSocket)
  // ------------------------------------------------------------
  useEffect(() => {
    if (token === "") {
      // Holatro ba'di render meguzorem (hamon usuli boqii loyiha)
      queueMicrotask(() => setSignalStatus("off"));
      return;
    }

    const realtime = new Realtime(token);
    hub.current = realtime;
    ringer.current = new Ringer();

    queueMicrotask(() => setSignalStatus(realtime.status));
    const timer = setInterval(() => setSignalStatus(realtime.status), 2000);

    const off = realtime.on((message) => {
      void handleMessage(message);
    });

    async function handleMessage(message: RealtimeMessage) {
      const { event } = message;
      const data = (message.data ?? {}) as Record<string, unknown>;

      // ---------- Payomi nav (chat) ----------
      if (event === "chat:message") {
        const chatId = pickNumber(data, ["chatId"]);
        const from = pickString(data, ["userId", "fromUserId", "senderUserId"]);
        if (chatId !== null) {
          for (const listener of [...chatListeners.current]) {
            listener(chatId, from ?? "");
          }
        }
        return;
      }

      // ---------- "Menavisad" ----------
      if (event === "chat:typing") {
        const chatId = pickNumber(data, ["chatId"]);
        const from = pickString(data, ["userId", "fromUserId"]);
        const on =
          data.isTyping === true || data.typing === true || data.on === true;
        if (chatId !== null) {
          for (const listener of [...typingListeners.current]) {
            listener(chatId, from ?? "", on);
          }
        }
        return;
      }

      if (!event.startsWith("call:")) return;

      const incomingId = pickNumber(data, ["callId"]);

      // ---------- Zangi nav ----------
      if (event === "call:incoming") {
        const record = message.data as CallRecord;
        if (typeof record?.callId !== "number") return;

        // Man band hastam -> backend khudash "band"-ro hisob mekunad,
        // mo faqat rad mekunem.
        if (phaseRef.current === "ended") clearEndTimer();
        if (
          phaseRef.current !== "idle" &&
          phaseRef.current !== "ended" &&
          callId.current !== record.callId
        ) {
          void declineCall(tokenRef.current, record.callId).catch(() => {});
          return;
        }

        callId.current = record.callId;
        mediaRef.current = record.type === "video" ? "video" : "audio";
        isCaller.current = false;
        iceQueue.current = [];
        pendingOffer.current = null;

        iceServers.current =
          Array.isArray(record.iceServers) && record.iceServers.length > 0
            ? record.iceServers
            : FALLBACK_ICE;

        const from: CallPeer = {
          userId: record.callerUserId,
          userName: record.callerUserName,
          fullName: record.callerFullName || record.callerUserName,
          image: record.callerImage,
          chatId: record.chatId ?? 0,
        };
        peerRef.current = from;

        setPeer(from);
        setMedia(mediaRef.current);
        setNote("");
        setPhaseSafe("incoming");
        ringer.current?.play("incoming");

        ringTimer.current = setTimeout(() => {
          finish("Zvanoki nagirifta.");
        }, RING_TIMEOUT);
        return;
      }

      // Az in jo poyon - faqat signalhoi HAMIN zvanok
      if (incomingId === null || incomingId !== callId.current) return;

      // ---------- SDP: offer ----------
      if (event === "call:offer") {
        const offer = pickSdp(data);
        if (offer === null) return;

        // Hanuz qabul nakardaam -> nigoh medoram
        if (phaseRef.current === "incoming") {
          pendingOffer.current = offer;
          return;
        }

        const connection = pc.current ?? buildPeerConnection();
        try {
          await connection.setRemoteDescription(
            new RTCSessionDescription(offer)
          );
          for (const candidate of iceQueue.current) {
            await connection.addIceCandidate(candidate).catch(() => {});
          }
          iceQueue.current = [];

          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          emit("call:answer", { callId: incomingId, sdp: answer });
        } catch {
          void stopCall(tr().linkFailed);
        }
        return;
      }

      // ---------- SDP: answer ----------
      if (event === "call:answer") {
        const answer = pickSdp(data);
        const connection = pc.current;
        if (answer === null || connection === null) return;

        try {
          if (connection.signalingState !== "stable") {
            await connection.setRemoteDescription(
              new RTCSessionDescription(answer)
            );
          }
          for (const candidate of iceQueue.current) {
            await connection.addIceCandidate(candidate).catch(() => {});
          }
          iceQueue.current = [];

          if (phaseRef.current === "outgoing") setPhaseSafe("connecting");
        } catch {
          void stopCall(tr().linkFailed);
        }
        return;
      }

      // ---------- ICE ----------
      if (event === "call:ice-candidate") {
        const raw = data.candidate;
        if (raw === undefined || raw === null) return;

        const candidate = (
          typeof raw === "string"
            ? {
                candidate: raw,
                sdpMid: pickString(data, ["sdpMid"]) ?? undefined,
                sdpMLineIndex: pickNumber(data, ["sdpMLineIndex"]) ?? undefined,
              }
            : raw
        ) as RTCIceCandidateInit;

        const connection = pc.current;
        if (connection === null || connection.remoteDescription === null) {
          iceQueue.current.push(candidate);
          if (iceQueue.current.length > 120) iceQueue.current.shift();
          return;
        }
        await connection.addIceCandidate(candidate).catch(() => {});
        return;
      }

      // ---------- Boqii "call:*" - holati zvanok ----------
      // Sanjida shud: backend "call:accepted" (status "active"),
      // "call:ended" (status "ended"), "call:declined" mefiristad.
      // Mo ba NOMI hodisa vobasta nestem - az `status` mefahmem.
      const status = pickString(data, ["status"]);
      if (status === null) return;

      // Allakay tamom shud - takror kor nakunem
      if (phaseRef.current === "idle" || phaseRef.current === "ended") return;

      if (status === "active") {
        if (phaseRef.current === "outgoing") setPhaseSafe("connecting");
        return;
      }

      if (status === "declined") {
        finish(tr().callRejected);
        return;
      }
      if (status === "missed") {
        finish(tr().noAnswer);
        return;
      }
      if (status === "cancelled") {
        finish(tr().callCancelled);
        return;
      }
      if (status === "failed") {
        finish(tr().callFailed);
        return;
      }
      if (status === "ended") {
        finish("Zvanok tamom shud.");
      }
    }

    return () => {
      clearInterval(timer);
      off();
      realtime.close();
      hub.current = null;
      ringer.current?.dispose();
      ringer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ------------------------------------------------------------
  //  Payomho: hozir backend khudash "chat:message"-ro mefiristad
  // ------------------------------------------------------------
  const notifyChat = useCallback((_toUserId: string, _chatId: number) => {
    // Kore lozim nest - server khudash ba giranda khabar medihad.
  }, []);

  const onChatEvent = useCallback(
    (listener: (chatId: number, fromUserId: string) => void) => {
      chatListeners.current.add(listener);
      return () => {
        chatListeners.current.delete(listener);
      };
    },
    []
  );

  const notifyTyping = useCallback(
    (toUserId: string, chatId: number, on: boolean) => {
      if (hub.current === null || me === null) return;
      if (toUserId === "" || sameId(toUserId, me.userId)) return;

      hub.current.send("chat:typing", { chatId, isTyping: on, toUserId });
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

  // Agar sahifa basta shavad - zvanokro tamom mekunem
  useEffect(() => {
    function onLeave() {
      const id = callId.current;
      if (
        id !== null &&
        phaseRef.current !== "idle" &&
        phaseRef.current !== "ended"
      ) {
        // "keepalive" - so-rov hangomi basta shudani sahifa ham meravad
        const url = `/chats/proxy/Call/end-call?callId=${id}&reason=leave`;
        try {
          void fetch(url, {
            method: "POST",
            headers:
              tokenRef.current === ""
                ? undefined
                : { Authorization: `Bearer ${tokenRef.current}` },
            keepalive: true,
          });
        } catch {
          // guzoshtan
        }
      }
      cleanup();
    }

    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [cleanup]);

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

// ------------------------------------------------------------
//  Yordamchiho: payomi server har khel shakl doshta metavonad
// ------------------------------------------------------------
function pickNumber(
  data: Record<string, unknown>,
  keys: string[]
): number | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function pickString(
  data: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
}

// SDP metavonad "sdp", "offer", "answer" yo "description" nom doshta
// bosad, va yo obekt bosad yo satr.
function pickSdp(
  data: Record<string, unknown>
): RTCSessionDescriptionInit | null {
  for (const key of ["sdp", "offer", "answer", "description"]) {
    const value = data[key];

    if (value !== null && typeof value === "object") {
      const shape = value as RTCSessionDescriptionInit;
      if (typeof shape.sdp === "string" && typeof shape.type === "string") {
        return shape;
      }
    }

    if (typeof value === "string" && value.includes("v=")) {
      const type = data.type === "answer" || key === "answer" ? "answer" : "offer";
      return { type, sdp: value };
    }
  }
  return null;
}

export function useCall(): CallState {
  const value = useContext(CallContext);
  if (value === null) {
    throw new Error("useCall faqat daruni <CallProvider> kor mekunad");
  }
  return value;
}
