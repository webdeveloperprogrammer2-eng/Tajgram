// ============================================================
//  lib/adminStore.ts   (FAQAT dar server kor mekunad)
//
//  Backend-i Instagram nақши "ban" va "shikoyat" (zhaloba)
//  NADORAD. Baroi hamin mo onhoro dar KHUDI server-i Next
//  nigoh medorem - dar yak fayli JSON.
//
//  DIQQAT: in fayl dar diski server ast. Dar rejimi `next dev`
//  va serveri doimi (masalan VPS) kor mekunad. Dar muhiti
//  "serverless" (Vercel) disk vaqti ast - ba'di deploy pok
//  meshavad. Baroi loyihai mahalli in kофист.
// ============================================================
import { promises as fs } from "node:fs";
import path from "node:path";

export type Ban = {
  userId: string;
  userName: string;
  fullName: string;
  reason: string;
  /** null = hamesha; raqam = vaqti tamomshavi (ms, Date.now). */
  until: number | null;
  createdAt: number;
};

export type Complaint = {
  id: string;
  /** Kі shikoyat kard (nomi admin yo "system"). */
  by: string;
  text: string;
  createdAt: number;
};

type Store = {
  bans: Record<string, Ban>;
  complaints: Record<string, Complaint[]>;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "admin.json");

const EMPTY: Store = { bans: {}, complaints: {} };

async function read(): Promise<Store> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      bans: parsed.bans ?? {},
      complaints: parsed.complaints ?? {},
    };
  } catch {
    // Fayl hanuz nest - store-i kholi.
    return { bans: {}, complaints: {} };
  }
}

async function write(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
}

// ------------------------------------------------------------
//  BAN
// ------------------------------------------------------------

/** Ban-i ZINDA-i korbar, yo `null`. Ban-i guzashta khudkor pok meshavad. */
export async function getActiveBan(userId: string): Promise<Ban | null> {
  const store = await read();
  const ban = store.bans[userId];
  if (!ban) return null;

  // Muddat guzasht -> pok mekunem.
  if (ban.until !== null && ban.until <= Date.now()) {
    delete store.bans[userId];
    await write(store);
    return null;
  }

  return ban;
}

export async function listBans(): Promise<Ban[]> {
  const store = await read();
  const now = Date.now();
  const alive: Ban[] = [];
  let changed = false;

  for (const [id, ban] of Object.entries(store.bans)) {
    if (ban.until !== null && ban.until <= now) {
      delete store.bans[id];
      changed = true;
    } else {
      alive.push(ban);
    }
  }

  if (changed) await write(store);
  return alive;
}

export async function setBan(ban: Ban): Promise<void> {
  const store = await read();
  store.bans[ban.userId] = ban;
  await write(store);
}

export async function removeBan(userId: string): Promise<void> {
  const store = await read();
  delete store.bans[userId];
  await write(store);
}

// ------------------------------------------------------------
//  SHIKOYAT (zhaloba)
// ------------------------------------------------------------

export async function listComplaints(userId: string): Promise<Complaint[]> {
  const store = await read();
  return (store.complaints[userId] ?? []).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

export async function addComplaint(
  userId: string,
  complaint: Complaint,
): Promise<Complaint[]> {
  const store = await read();
  const list = store.complaints[userId] ?? [];
  list.push(complaint);
  store.complaints[userId] = list;
  await write(store);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function removeComplaint(
  userId: string,
  complaintId: string,
): Promise<Complaint[]> {
  const store = await read();
  const list = (store.complaints[userId] ?? []).filter(
    (c) => c.id !== complaintId,
  );
  store.complaints[userId] = list;
  await write(store);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

/** Shumorai shikoyathoi har korbar - baroi jadvali umumi. */
export async function complaintCounts(): Promise<Record<string, number>> {
  const store = await read();
  const out: Record<string, number> = {};
  for (const [id, list] of Object.entries(store.complaints)) {
    if (list.length > 0) out[id] = list.length;
  }
  return out;
}
