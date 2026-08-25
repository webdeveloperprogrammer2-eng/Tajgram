// ============================================================
//  app/chats/signal/route.ts
//
//  SERVER-i SIGNALING baroi zvanok va payomhoi real-time.
//
//  CHARO IN LOZIM AST?
//  Dar swagger-i backend HECH endpoint-i zvanok/socket NEST.
//  WebRTC be "signaling" kor namekunad - offer/answer/ICE boyad
//  az yak roh guzarand. Baroi hamin roh-i khudamonro dar hamin
//  ilova soakhtem ("long polling"):
//
//    GET  /chats/signal?userId=..&after=..  -> to 20 soniya sabr,
//                                              payomhoi tozaro medihad
//    POST /chats/signal                     -> yak signalro ba "to" meguzorad
//
//  KURSOR (after/cursor) - MUHIM:
//  Peshtar signal ba YAK waiter doda meshud va az navbat tark
//  meshud. Agar on payvast allakay murda bud (browser sahifaro
//  iavz kard, dev-server az nav bor shud), signal ABADAN gum
//  meshud -> "zang mezanam vale ba u zvanok nameoyad".
//  Hozir hech chiz tark nameshavad: har signal raqami khud (seq)
//  dorad, client oakhirin raqamro nigoh medorad va az on ba'd
//  mepursad. Payvasti murda hech chizro namekhurad.
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

type Item = { seq: number; at: number; signal: unknown };

type Waiter = () => void;

type Mailbox = {
  items: Item[];
  seq: number;
  waiters: Set<Waiter>;
  touched: number;
};

// Dar rejimi dev Next modulhoro az nav bor mekunad ->
// khotiraro dar globalThis nigoh medorem, to gum nashavad.
type Store = { boxes: Map<string, Mailbox> };

// DIQQAT: raqami okhir (v2) MUHIM ast. Dar rejimi dev khotira
// bayni bor-kunihoi modul memonad. Agar shakli Mailbox ivaz shavad,
// quttihoi KUHNA memonand va kod bo khatoi "items is undefined"
// meaftad. Raqamro ivaz kunem -> khotirai toza.
const globalStore = globalThis as unknown as {
  __tajgramSignalV2?: Store;
};

const store: Store =
  globalStore.__tajgramSignalV2 ?? (globalStore.__tajgramSignalV2 = {
    boxes: new Map(),
  });

const WAIT_MS = 20_000; // chand vaqt sabr mekunem
const KEEP_MS = 60_000; // signal chand vaqt dar navbat memonad
const DEAD_MS = 180_000; // quttihoi kuhnaro tark mekunem
const MAX_ITEMS = 200;
// Bori avval chand soniyai guzastaro ham megirem (sahifa bor mesud)
const GRACE_MS = 25_000;

// Har du taraf boyad AYNAN yak kalidro binand.
// GUID-ho gohe bo harfhoi kalon, gohe khurd meoyand ->
// hamesha ba yak shakl meorem.
function key(raw: string): string {
  return raw.trim().toLowerCase();
}

function box(userId: string): Mailbox {
  const id = key(userId);
  const found = store.boxes.get(id);

  // Shaklashro ham tekshir mekunem - agar qutti kuhna boshad,
  // az nav mesozem (ba joyi khato aftodan).
  if (found !== undefined && Array.isArray(found.items)) {
    found.touched = Date.now();
    return found;
  }

  const fresh: Mailbox = {
    items: [],
    seq: 0,
    waiters: new Set(),
    touched: Date.now(),
  };
  store.boxes.set(id, fresh);
  return fresh;
}

// Signalhoi kuhna va quttihoi kuhna (korbar raftaast) - toza mekunem
function sweep() {
  const now = Date.now();

  for (const [id, mail] of store.boxes) {
    if (!Array.isArray(mail.items)) {
      store.boxes.delete(id);
      continue;
    }

    mail.items = mail.items.filter((item) => now - item.at < KEEP_MS);

    if (
      now - mail.touched > DEAD_MS &&
      mail.waiters.size === 0 &&
      mail.items.length === 0
    ) {
      store.boxes.delete(id);
    }
  }
}

// ------------------------------------------------------------
//  GET - "ba'di raqami `after` baroi man chize hast?"
// ------------------------------------------------------------
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (userId === null || userId.trim() === "") {
    return Response.json({ items: [], cursor: 0 }, { status: 400 });
  }

  sweep();
  const mail = box(userId);

  // BORI AVVAL (after nadodashuda):
  // Peshtar in jo `Number(null)` -> 0 mesud (bogi khomush!), yane
  // HAMAI signalhoi 60 soniyai guzasta az nav dodа mesudand -
  // zvanoki KUHNA "az nav" zang mezad. Vale agar faqat az mail.seq
  // sar kunem, zange ki 2 soniya pes firistoda sud (dar in dam
  // sahifa bor mesud) tamoman gum mesavad.
  //
  // Baroi hamin: az signalhoi TOZA (to GRACE_MS) sar mekunem.
  const rawAfter = request.nextUrl.searchParams.get("after");
  const parsed = rawAfter === null ? Number.NaN : Number(rawAfter);

  let after: number;

  if (Number.isFinite(parsed) && parsed >= 0) {
    after = parsed;
  } else {
    const edge = Date.now() - GRACE_MS;
    const firstFresh = mail.items.find((item) => item.at >= edge);
    after = firstFresh === undefined ? mail.seq : firstFresh.seq - 1;
  }

  const take = () => mail.items.filter((item) => item.seq > after);

  let fresh = take();

  // Agar hozir chize naboshad - sabr mekunem
  if (fresh.length === 0) {
    await new Promise<void>((resolve) => {
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;

        mail.waiters.delete(finish);
        clearTimeout(timer);
        resolve();
      };

      const timer = setTimeout(finish, WAIT_MS);
      mail.waiters.add(finish);

      // Agar browser so-rovro qat' kunad
      request.signal.addEventListener("abort", finish);
    });

    fresh = take();
  }

  // DIQQAT: chize az navbat TARK NAMEKUNEM. Agar in javob ba
  // client narasad, so-rovi oyanda hamon signalro boz megirad.
  const cursor = fresh.length > 0 ? fresh[fresh.length - 1].seq : after;

  return Response.json({
    items: fresh.map((item) => item.signal),
    cursor,
  });
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
  if (typeof to !== "string" || to.trim() === "") {
    return Response.json({ ok: false }, { status: 400 });
  }

  const mail = box(to);

  mail.seq += 1;
  mail.items.push({ seq: mail.seq, at: Date.now(), signal });
  if (mail.items.length > MAX_ITEMS) mail.items.shift();

  // HAMAI sabrkunandaro bedor mekunem (odam metavonad chand tab
  // kushoda boshad) - har kadom khudash navbatro mekhonad.
  if (mail.waiters instanceof Set) {
    for (const waiter of [...mail.waiters]) waiter();
  }

  return Response.json({ ok: true });
}
