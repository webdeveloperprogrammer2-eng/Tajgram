"use client";

// ============================================================
//  lib/blocks.ts - ro-ykhati bastagon dar TARAFI BROWSER.
//
//  YAK JOI YAGONA: sahifai profil, lenta va tanzimot HAMA az
//  hamin ro-ykhat mekhonand. Baroi hamin agar dar profil kase
//  basta shavad, posthoi u DARHOL az lenta ghoib meshavand -
//  be navsozii sahifa.
//
//  So-rov FAQAT YAK BOR merfat (nigoh: `loaded`), sipas hama
//  az khotira mekhonand.
// ============================================================
import { useSyncExternalStore } from "react";

import { getToken } from "./auth";

export type BlockedEntry = {
  userId: string;
  userName: string;
  fullName: string;
  image: string | null;
  blockedAt: number;
};

let entries: BlockedEntry[] = [];
let ids: ReadonlySet<string> = new Set();
let loaded = false;
let pending: Promise<BlockedEntry[]> | null = null;

const listeners = new Set<() => void>();

function apply(next: BlockedEntry[]) {
  entries = next;
  ids = new Set(next.map((item) => item.userId));
  loaded = true;
  listeners.forEach((fn) => fn());
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token === null ? {} : { Authorization: `Bearer ${token}` };
}

async function send(
  path: string,
  init: RequestInit,
): Promise<BlockedEntry[]> {
  const response = await fetch(path, {
    ...init,
    headers: { ...(init.headers ?? {}), ...authHeaders() },
  });

  const body = (await response.json().catch(() => null)) as {
    data?: BlockedEntry[];
    error?: string;
  } | null;

  if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);

  return body?.data ?? [];
}

/** Ro-ykhatro yak bor megirem. Boz kardan -> hamon so-rovi jori. */
export function loadBlocked(force = false): Promise<BlockedEntry[]> {
  if (!force && loaded) return Promise.resolve(entries);
  if (!force && pending !== null) return pending;

  if (getToken() === null) {
    apply([]);
    return Promise.resolve(entries);
  }

  pending = send("/api/block", { method: "GET" })
    .then((list) => {
      apply(list);
      return entries;
    })
    .catch(() => {
      // Shabaka nashud - ro-ykhati kholi behtar az sahifai shikasta.
      if (!loaded) apply([]);
      return entries;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}

export async function blockUser(user: {
  userId: string;
  userName?: string;
  fullName?: string;
  image?: string | null;
}): Promise<void> {
  const list = await send("/api/block", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetUserId: user.userId,
      userName: user.userName ?? "",
      fullName: user.fullName ?? "",
      image: user.image ?? null,
    }),
  });
  apply(list);
}

export async function unblockUser(userId: string): Promise<void> {
  const list = await send(
    `/api/block?userId=${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
  apply(list);
}

// ------------------------------------------------------------
//  React
// ------------------------------------------------------------

function subscribe(fn: () => void) {
  listeners.add(fn);
  void loadBlocked();
  return () => {
    listeners.delete(fn);
  };
}

const EMPTY: ReadonlySet<string> = new Set();

/** ID-hoi kasone ki MAN bastaam. Dar server hamesha kholi. */
export function useBlockedIds(): ReadonlySet<string> {
  return useSyncExternalStore(
    subscribe,
    () => ids,
    () => EMPTY,
  );
}

/** Ro-ykhati purra - baroi sahifai tanzimot. */
export function useBlockedList(): BlockedEntry[] {
  return useSyncExternalStore(
    subscribe,
    () => entries,
    () => [],
  );
}

/** Ba'di baromadan az akkaunt - to ro-ykhati odami peshina namonad. */
export function resetBlocked() {
  loaded = false;
  pending = null;
  apply([]);
  loaded = false;
}
