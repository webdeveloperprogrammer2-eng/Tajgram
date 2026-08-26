"use client";

// ============================================================
//  app/chats/chatPrefs.ts
//
//  Sozishhoi HAR SUHBAT alohida (dar hamin browser nigoh
//  doshta meshavad - dar backend chunin endpoint NEST):
//
//    muteSound  - sadoi payomi nav khomush
//    muteNotify - OGOHINOMA namoyon nashavad
//                 (payom hamon tavr meoyad va khonda meshavad,
//                  faqat "vsplivayushiy" nest)
//
//  Hamai qismho (menyui suhbat, MessageAlerts) az hamin yak
//  joy mekhonand va ba hodisai "tajgram-chat-prefs" gush
//  medihand - to tugma va ogohinoma HAMESHA yak khel boshand.
// ============================================================

export type ChatPrefs = {
  muteSound: boolean;
  muteNotify: boolean;
};

const KEY = "tajgram_chat_prefs";
const EVENT = "tajgram-chat-prefs";

const OFF: ChatPrefs = { muteSound: false, muteNotify: false };

type Store = Record<string, ChatPrefs>;

function readStore(): Store {
  if (typeof localStorage === "undefined") return {};

  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return {};

    const parsed = JSON.parse(raw) as Store;
    return parsed !== null && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // joyi khoto - sozishho faqat to navshavii sahifa memonand
  }
}

/** Sozishhoi yak suhbat. Agar nabosad - hama chiz "yoqun". */
export function readChatPrefs(chatId: number): ChatPrefs {
  const saved = readStore()[String(chatId)];
  if (saved === undefined) return OFF;

  return {
    muteSound: saved.muteSound === true,
    muteNotify: saved.muteNotify === true,
  };
}

/** Faqat maidonhoi dodashuda ivaz meshavand. */
export function writeChatPrefs(
  chatId: number,
  patch: Partial<ChatPrefs>
): ChatPrefs {
  const store = readStore();
  const next: ChatPrefs = { ...readChatPrefs(chatId), ...patch };

  // Agar hama chiz "yoqun" bosad - satrro umuman nigoh nadorem
  if (!next.muteSound && !next.muteNotify) delete store[String(chatId)];
  else store[String(chatId)] = next;

  writeStore(store);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: chatId }));
  }

  return next;
}

/** Suhbat tark shud -> sozishhoyash ham lozim nest. */
export function dropChatPrefs(chatId: number) {
  const store = readStore();
  if (store[String(chatId)] === undefined) return;

  delete store[String(chatId)];
  writeStore(store);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: chatId }));
  }
}

export function onChatPrefsChange(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = () => listener();
  window.addEventListener(EVENT, handler);
  // Dar tabhoi digar ham nav shavad
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

// ------------------------------------------------------------
//  KADOM suhbat AYNI HOZIR kushodaast?
//
//  MessageAlerts dar tamomi sayt gush medihad. Agar korbar
//  hamon suhbatro kushoda bosad, ogohinoma lozim nest -
//  payom khudash dar peshi chashm meoyad.
// ------------------------------------------------------------
let openChat: number | null = null;

export function setOpenChat(chatId: number | null) {
  openChat = chatId;
}

export function getOpenChat(): number | null {
  return openChat;
}
