"use client";

// ============================================================
//  app/chats/call/realtime.ts
//
//  ALOQAI ZINDA (WebSocket) BO BACKEND-I HAQIQI.
//
//  CHI TAVR MA'LUM SHUD (25.08.2026 sanjida shud):
//  Peshtar dar in papka navishta shuda bud ki "dar backend hech
//  endpoint-i zvanok nest", va baroi hamin yak signaling-i
//  KHUDSOKHTA dar daruni Next.js soakhta shuda bud
//  (app/chats/signal/route.ts, long polling, khotirai server).
//  On DIGAR DURUST NEST. Backend allakay dorad:
//
//    WebSocket:  wss://<backend>/realtime?token=<JWT>
//    REST:       /Call/start-call, answer-call, decline-call,
//                end-call, get-calls, get-ice-servers, ...
//
//  Signaling-i khudsokhta ma'lumotro dar KHOTIRAI HAMON
//  protsessi Next nigoh medosht. Yane zang faqat on vaqt
//  merasid, ki HAR DU odam ba AYNAN hamon yak protsessi
//  `next dev` (yo hamon yak nusakhai serverless) payvast
//  boshand. Dar amal - du dastgoh, du kompyuter, yo deploy
//  bo chandin nusakha => zang HECH GOH namerasid.
//  Payomho "kor mekardand", chunki onho az backend meoyand
//  va ChatWindow har 2.5 soniya az nav mekhonad.
//
//  ROHI DURUST hamin fayl ast: yak payvasti WebSocket ba
//  backend, ki dar HAMAI dastgohho yak khel kor mekunad.
//
//  PROTOKOL (amali sanjida shud):
//    server -> {"event":"connection:ready","data":{userId,userName,heartbeatMs}}
//    mo     -> {"event":"ping"}            server -> {"event":"pong",...}
//    server -> {"event":"call:incoming","data":{...CallDto, iceServers}}
//    mo     -> {"event":"call:offer","data":{callId, sdp}}
//    server -> hamon data-ro ba tarafi digar meguzoronad va
//              `fromUserId`-ro ilova mekunad.
//    hamin tavr: "call:answer", "call:ice-candidate", "chat:typing"
//    server -> {"event":"chat:message", ...} - payomi nav
//    server -> {"event":"error","data":{message,event}}
// ============================================================

export const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://instagram-back-qibs.onrender.com"
)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/docs$/i, "");

// Dar backend in "WS_PATH" nomida meshavad, pesh-farz "/realtime".
const WS_PATH = process.env.NEXT_PUBLIC_WS_PATH ?? "/realtime";

export function realtimeUrl(token: string): string {
  const base = BACKEND_URL.replace(/^http/, "ws");
  return `${base}${WS_PATH}?token=${encodeURIComponent(token)}`;
}

export type RealtimeStatus = "off" | "connecting" | "online";

export type RealtimeMessage = { event: string; data: unknown };

type Listener = (message: RealtimeMessage) => void;

// Server har 25 soniya intizori hayot ast - mo kamtar mefiristem.
const PING_MS = 20_000;
const PONG_WAIT_MS = 12_000;
const RETRY_MIN_MS = 1_000;
const RETRY_MAX_MS = 15_000;

export class Realtime {
  private token: string;
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private closed = false;

  private retry = RETRY_MIN_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;

  // Payomhoe ki hangomi payvast nabudan navbat mekashand
  private queue: RealtimeMessage[] = [];

  status: RealtimeStatus = "off";
  /** userId-i haqiqi az server (na az token) */
  userId: string | null = null;

  constructor(token: string) {
    this.token = token;
    this.open();
  }

  private open() {
    if (this.closed || this.token === "") return;

    this.status = "connecting";

    let socket: WebSocket;
    try {
      socket = new WebSocket(realtimeUrl(this.token));
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;

    socket.onopen = () => {
      if (this.closed) return;

      this.retry = RETRY_MIN_MS;
      this.status = "online";

      // Navbatro holi mekunem
      const waiting = this.queue;
      this.queue = [];
      for (const message of waiting) this.rawSend(message);

      this.startPing();
    };

    socket.onmessage = (event) => {
      if (this.closed) return;

      let message: RealtimeMessage;
      try {
        const parsed = JSON.parse(String(event.data)) as RealtimeMessage;
        if (typeof parsed?.event !== "string") return;
        message = parsed;
      } catch {
        return;
      }

      if (message.event === "pong") {
        this.clearPong();
        return;
      }

      if (message.event === "connection:ready") {
        const data = message.data as { userId?: string } | null;
        if (typeof data?.userId === "string") this.userId = data.userId;
        this.status = "online";
      }

      for (const listener of [...this.listeners]) listener(message);
    };

    socket.onclose = () => {
      if (this.closed) return;
      this.socket = null;
      this.stopPing();
      this.status = "off";
      this.scheduleReconnect();
    };

    socket.onerror = () => {
      // onclose khudash ba'd meoyad
    };
  }

  // ---- zinda budanro tekshir mekunem ----
  private startPing() {
    this.stopPing();

    this.pingTimer = setInterval(() => {
      if (this.socket === null || this.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      this.rawSend({ event: "ping", data: {} });

      // Agar javob naoyad - payvast murdaast, az nav mekushoem
      this.clearPong();
      this.pongTimer = setTimeout(() => {
        try {
          this.socket?.close();
        } catch {
          // onclose khudash reconnect mekunad
        }
      }, PONG_WAIT_MS);
    }, PING_MS);
  }

  private stopPing() {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.clearPong();
  }

  private clearPong() {
    if (this.pongTimer !== null) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.closed || this.reconnectTimer !== null) return;

    const wait = this.retry;
    this.retry = Math.min(RETRY_MAX_MS, this.retry * 2);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.open();
    }, wait);
  }

  private rawSend(message: RealtimeMessage) {
    try {
      this.socket?.send(JSON.stringify(message));
    } catch {
      // guzoshtan - navbat yo reconnect kor mekunad
    }
  }

  /** Payom ba server. Agar payvast naboshad - navbat mekashad. */
  send(event: string, data: unknown) {
    if (this.closed) return;

    const message: RealtimeMessage = { event, data };

    if (this.socket !== null && this.socket.readyState === WebSocket.OPEN) {
      this.rawSend(message);
      return;
    }

    // Signalhoi zvanok tez kuhna meshavand - navbat kalon lozim nest
    this.queue.push(message);
    if (this.queue.length > 40) this.queue.shift();
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  close() {
    this.closed = true;
    this.listeners.clear();
    this.queue = [];
    this.stopPing();

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      this.socket?.close();
    } catch {
      // guzoshtan
    }
    this.socket = null;
    this.status = "off";
  }
}

// GUID-ho az endpoint-hoi gunogun gohe bo harfi kalon, gohe khurd
// meoyand. Hamesha ba yak shakl meorem - be in muqoisa nodurust ast.
export function sameId(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
