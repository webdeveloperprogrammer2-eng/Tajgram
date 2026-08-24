// ============================================================
//  app/chats/signal/route.ts
//
//  SERVER-i SIGNALING baroi zvanok (khudi mo, na backend).
//
//  CHARO IN LOZIM AST?
//  Dar swagger-i backend HECH endpoint-i zvanok/socket NEST.
//  WebRTC be "signaling" kor namekunad - offer/answer/ICE boyad
//  az yak roh guzarand. Baroi hamin roh-i khudamonro dar hamin
//  ilova soakhtem ("long polling"):
//
//    GET  /chats/signal?userId=..   -> 25 soniya sabr mekunad,
//                                      payomhoi tozaro bar megardonad
//    POST /chats/signal             -> yak signalro ba "to" meguzorad
//
//  Ma'lumot dar KHOTIRAI server nigoh doshta meshavad (baza lozim
//  nest) - zvanok fori ast, ba'di on chize namemonad.
//
//  DIQQAT: agar ilova dar chandin nuskhai server kor kunad
//  (masalan Vercel serverless), du taraf metavonand ba du
//  nuskhai gunogun aftand. Dar in hol server-i alohidai
//  WebSocket lozim ast -> NEXT_PUBLIC_CALL_SIGNALING_URL.
// ============================================================

import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Waiter = (list: unknown[]) => void;

type Mailbox = {
  queue: unknown[];
  waiters: Waiter[];
  touched: number;
};

// Dar rejimi dev Next modulhoro az nav bor mekunad ->
// khotiraro dar globalThis nigoh medorem, to gum nashavad.
type Store = { boxes: Map<string, Mailbox> };

const globalStore = globalThis as unknown as {
  __tajgramSignal?: Store;
};

const store: Store =
  globalStore.__tajgramSignal ?? (globalStore.__tajgramSignal = {
    boxes: new Map(),
  });

const WAIT_MS = 25_000; // chand vaqt sabr mekunem
const DEAD_MS = 120_000; // quttihoi kuhnaro tark mekunem

function box(userId: string): Mailbox {
  const found = store.boxes.get(userId);
  if (found !== undefined) {
    found.touched = Date.now();
    return found;
  }

  const fresh: Mailbox = { queue: [], waiters: [], touched: Date.now() };
  store.boxes.set(userId, fresh);
  return fresh;
}

// Quttihoi kuhna (korbar raftaast) - toza mekunem
function sweep() {
  const now = Date.now();

  for (const [key, value] of store.boxes) {
    if (
      now - value.touched > DEAD_MS &&
      value.waiters.length === 0 &&
      value.queue.length === 0
    ) {
      store.boxes.delete(key);
    }
  }
}

// ------------------------------------------------------------
//  GET - "baroi man chize hast?" (25 soniya sabr)
// ------------------------------------------------------------
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (userId === null || userId === "") {
    return Response.json({ items: [] }, { status: 400 });
  }

  sweep();
  const mail = box(userId);

  // Agar allakay chize boshad - darhol medihem
  if (mail.queue.length > 0) {
    const items = mail.queue;
    mail.queue = [];
    return Response.json({ items });
  }

  // Nabosad - sabr mekunem
  const items = await new Promise<unknown[]>((resolve) => {
    let done = false;

    const finish = (list: unknown[]) => {
      if (done) return;
      done = true;

      const index = mail.waiters.indexOf(finish);
      if (index >= 0) mail.waiters.splice(index, 1);

      clearTimeout(timer);
      resolve(list);
    };

    const timer = setTimeout(() => finish([]), WAIT_MS);
    mail.waiters.push(finish);

    // Agar browser so-rovro qat' kunad
    request.signal.addEventListener("abort", () => finish([]));
  });

  return Response.json({ items });
}

// ------------------------------------------------------------
//  POST - "in signalro ba hamsuhbat firist"
// ------------------------------------------------------------
export async function POST(request: NextRequest) {
  let signal: { to?: string } | null = null;

  try {
    signal = (await request.json()) as { to?: string };
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const to = signal?.to;
  if (typeof to !== "string" || to === "") {
    return Response.json({ ok: false }, { status: 400 });
  }

  const mail = box(to);

  // Agar tarafi digar hozir sabr karda istoda bosad - fori medihem
  const waiter = mail.waiters.shift();
  if (waiter !== undefined) {
    waiter([signal]);
  } else {
    mail.queue.push(signal);
    // az 50 payom ziyod nigoh namedorem
    if (mail.queue.length > 50) mail.queue.shift();
  }

  return Response.json({ ok: true });
}
