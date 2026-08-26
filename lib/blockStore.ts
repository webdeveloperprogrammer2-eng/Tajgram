// ============================================================
//  lib/blockStore.ts   (FAQAT dar server kor mekunad)
//
//  "Blok" - RO-YKHATI SHAKHSI. Har korbar ro-ykhati khudashro
//  dorad: "man kiro basta-am". Kasi digar inro NAMEBINAD va
//  ba korbari bastashuda HECH kas khabar namedihad - aynan
//  monandi instagram.
//
//  CHARO IN JO, NA DAR BACKEND?
//  Backend faqat DU nuqta dorad: get-blocked-users va
//  unblock-user. Nuqtai "block-user"-i tasdiqshuda nest,
//  baroi hamin mo ro-ykhatro dar khudi server-i Next nigoh
//  medorem - hamon tavre ki lib/adminStore.ts ban-horo
//  nigoh medorad (yak fayli JSON dar .data/).
//
//  Sokhtor: { [manam]: [kasoni ki MAN bastaam] }
// ============================================================
import { promises as fs } from "node:fs";
import path from "node:path";

export type BlockedEntry = {
  userId: string;
  userName: string;
  fullName: string;
  image: string | null;
  /** Kay basta shud (ms, Date.now). */
  blockedAt: number;
};

type Store = Record<string, BlockedEntry[]>;

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "blocks.json");

async function read(): Promise<Store> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Store;
    return parsed ?? {};
  } catch {
    // Fayl hanuz nest - hech kas hech kasro nabastaast.
    return {};
  }
}

async function write(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
}

/** Kasone ki `ownerId` bastaast - navtarin dar boло. */
export async function listBlocked(ownerId: string): Promise<BlockedEntry[]> {
  const store = await read();
  return [...(store[ownerId] ?? [])].sort((a, b) => b.blockedAt - a.blockedAt);
}

/**
 * Bastan. Agar allakay basta bosad - ma'lumot NAV meshavad
 * (nom/surat ivaz shuda metavonad), vale du bor nameistad.
 */
export async function addBlock(
  ownerId: string,
  entry: BlockedEntry,
): Promise<BlockedEntry[]> {
  const store = await read();
  const list = (store[ownerId] ?? []).filter(
    (item) => item.userId !== entry.userId,
  );
  list.push(entry);
  store[ownerId] = list;
  await write(store);
  return [...list].sort((a, b) => b.blockedAt - a.blockedAt);
}

/** Kushodan. */
export async function removeBlock(
  ownerId: string,
  targetUserId: string,
): Promise<BlockedEntry[]> {
  const store = await read();
  const list = (store[ownerId] ?? []).filter(
    (item) => item.userId !== targetUserId,
  );

  if (list.length === 0) delete store[ownerId];
  else store[ownerId] = list;

  await write(store);
  return [...list].sort((a, b) => b.blockedAt - a.blockedAt);
}
