// ============================================================
//  app/chats/call/signaling.ts
//
//  ZVANOK (audio/video) bo WebRTC kor mekunad. WebRTC baroi
//  ulanishi du browser ba "SIGNALING" ehtiyoj dorad - yak roh,
//  ki az on offer/answer/ICE guzarad.
//
//  DIQQAT — MUHIM:
//  Dar swagger-i backend (https://instagram-back-qibs.onrender.com/docs/)
//  HECH endpoint-i zvanok/signaling/socket NEST. Sanjida shud:
//    /Chat/* -> faqat create-chat, get-chats, get-chat-by-id,
//               send-message, delete-message, delete-chat.
//  Baroi hamin in jo TRANSPORT-i ivazshavanda soakhta shud:
//
//    1) BroadcastChannel - hamesha kor mekunad, vale FAQAT
//       daruni yak browser (du tab / du oyna).
//    2) LONG POLLING az rohi /chats/signal - server-i KHUDI MO
//       (app/chats/signal/route.ts). Hamin roh zvanokro bayni
//       DU DASTGOHI gunogun kor mekunad va hech chizi zieda
//       lozim nest.
//    3) WebSocket - agar NEXT_PUBLIC_CALL_SIGNALING_URL dodashuda
//       boshad, ba joyi long polling on istifoda mesavad.
//
//  Yane vaqte backend socket-i signaling qushad, faqat YAK satri
//  .env lozim ast, kodi zvanok ivaz nameshavad:
//    NEXT_PUBLIC_CALL_SIGNALING_URL=wss://.../call
// ============================================================

export type CallMedia = "audio" | "video";

export type SignalKind =
  | "chat" // "ba tu payomi nav firistodam" (REAL TIME)
  | "ring" // "man ba tu zang mezanam"
  | "accept" // "qabul kardam"
  | "decline" // "rad kardam"
  | "busy" // "man dar zvanoki digar hastam"
  | "offer" // SDP offer
  | "answer" // SDP answer
  | "ice" // ICE candidate
  | "hangup"; // "zvanokro qat' kardam"

export type Signal = {
  kind: SignalKind;
  callId: string;
  chatId: number;
  media: CallMedia;

  from: string; // userId-i firistanda
  fromName: string;
  fromImage: string | null;

  to: string; // userId-i qabulkunanda

  // offer/answer -> RTCSessionDescriptionInit
  // ice          -> RTCIceCandidateInit
  // chat         -> { kind: "new" | "delete" }
  payload?: unknown;

  at: number;
};

export type SignalingStatus = "off" | "local" | "online";

type Listener = (signal: Signal) => void;

const CHANNEL = "tajgram-call";

export const SIGNALING_URL: string =
  process.env.NEXT_PUBLIC_CALL_SIGNALING_URL ?? "";

// Roh ba server-i signaling-i khudi mo (app/chats/signal/route.ts)
const POLL_URL = "/chats/signal";

// ------------------------------------------------------------
//  Yak "hub" - hamai transportho-ro yakjo mekunad
// ------------------------------------------------------------
export class Signaling {
  private selfId: string;
  private listeners = new Set<Listener>();
  private channel: BroadcastChannel | null = null;
  private socket: WebSocket | null = null;
  private seen = new Set<string>();
  private closed = false;
  private poller: AbortController | null = null;

  status: SignalingStatus = "off";

  constructor(selfId: string) {
    this.selfId = selfId;

    // ---- 1) BroadcastChannel (hamesha) ----
    if (typeof BroadcastChannel !== "undefined") {
      try {
        this.channel = new BroadcastChannel(CHANNEL);
        this.channel.onmessage = (event) => this.receive(event.data);
        this.status = "local";
      } catch {
        this.channel = null;
      }
    }

    // ---- 2) WebSocket yo long polling ----
    if (SIGNALING_URL !== "") {
      this.openSocket();
    } else {
      void this.pollLoop();
    }
  }

  // ------------------------------------------------------------
  //  LONG POLLING: hamesa az server mepursem "baroi man chize hast?"
  //  Har so-rov to 25 soniya kusoda memonad - baroi hamin
  //  signalho QARIB FORI merasand.
  // ------------------------------------------------------------
  private async pollLoop() {
    let fails = 0;

    while (!this.closed) {
      const controller = new AbortController();
      this.poller = controller;

      try {
        const response = await fetch(
          `${POLL_URL}?userId=${encodeURIComponent(this.selfId)}`,
          { signal: controller.signal, cache: "no-store" }
        );

        if (!response.ok) throw new Error(String(response.status));

        const body = (await response.json()) as { items?: unknown[] };
        fails = 0;
        this.status = "online";

        for (const item of body.items ?? []) this.receive(item);
      } catch {
        if (this.closed) return;

        fails += 1;
        if (this.status === "online") {
          this.status = this.channel === null ? "off" : "local";
        }

        // Agar server javob nadihad - kam-kam dertar mepursem
        const pause = Math.min(8000, 500 * fails);
        await new Promise((resolve) => setTimeout(resolve, pause));
      }
    }
  }

  private openSocket() {
    try {
      const url = new URL(SIGNALING_URL);
      url.searchParams.set("userId", this.selfId);

      const socket = new WebSocket(url.toString());
      this.socket = socket;

      socket.onopen = () => {
        if (this.closed) return;
        this.status = "online";
        socket.send(JSON.stringify({ kind: "hello", from: this.selfId }));
      };

      socket.onmessage = (event) => {
        try {
          this.receive(JSON.parse(String(event.data)));
        } catch {
          // payomi noma'lum - guzoshtan
        }
      };

      socket.onclose = () => {
        if (this.closed) return;
        this.socket = null;
        this.status = this.channel === null ? "off" : "local";
      };

      socket.onerror = () => {
        // onclose khudash ba'd meoyad
      };
    } catch {
      this.socket = null;
    }
  }

  // Payomi daromadaro tekshir mekunem: az MAN naboshad va BA MAN boshad
  private receive(raw: unknown) {
    if (this.closed) return;
    if (raw === null || typeof raw !== "object") return;

    const signal = raw as Signal;
    if (typeof signal.kind !== "string" || typeof signal.callId !== "string") {
      return;
    }
    if (signal.from === this.selfId) return; // sadoi khudam
    if (signal.to !== this.selfId) return; // ba digar kas

    // Yak payom du transport -> du bor naoyad
    const key = `${signal.callId}|${signal.kind}|${signal.at}|${JSON.stringify(
      signal.payload ?? null
    )}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    if (this.seen.size > 400) this.seen.clear();

    for (const listener of this.listeners) listener(signal);
  }

  send(signal: Omit<Signal, "at">) {
    if (this.closed) return;

    const full: Signal = { ...signal, at: Date.now() };

    try {
      this.channel?.postMessage(full);
    } catch {
      // guzoshtan
    }

    if (this.socket !== null && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(full));
      } catch {
        // guzoshtan
      }
      return;
    }

    // Rohi asosi: server-i khudi mo
    if (SIGNALING_URL === "") {
      void fetch(POLL_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(full),
        cache: "no-store",
      }).catch(() => {
        // guzoshtan - tarafi digar khudas hangup mekunad
      });
    }
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close() {
    this.closed = true;
    this.listeners.clear();

    try {
      this.channel?.close();
    } catch {
      // guzoshtan
    }
    try {
      this.socket?.close();
    } catch {
      // guzoshtan
    }
    try {
      this.poller?.abort();
    } catch {
      // guzoshtan
    }
    this.poller = null;

    this.channel = null;
    this.socket = null;
    this.status = "off";
  }
}

// ------------------------------------------------------------
//  Server-hoi STUN. TURN nest -> agar har du taraf dar
//  shabakai basta boshand, ulanish nashavad (in mahdudiyati
//  backend ast, na kodi mo).
// ------------------------------------------------------------
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

export function newCallId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
