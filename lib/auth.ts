"use client";

// ============================================================
//  lib/auth.ts
//
//  YAK JOI YAGONA baroi token-i korbar.
//
//  Peshtar har bakhsh (Auth, chats, profile, reels, search,
//  getInfoUsers) fayli token-i KHUDASHRO dosht va har yak
//  ba tarzi digar sanjish mekard: yake vaqti tamomshavii
//  token-ro mesanjid, digare NE. Baroi hamin dar yak sahifa
//  korbar "daromada" bud, dar digare "mehmon".
//
//  Hozir hamai onho ba HAMIN fayl ishora mekunand.
// ============================================================

import { TOKEN_KEY } from "@/components/themeKeys";

export { TOKEN_KEY };

/** Sahifai voridshavi. */
export const LOGIN_PATH = "/Auth/login";

// ------------------------------------------------------------
//  Daruni token (JWT) ma'lumoti korbar hast:
//  header.payload.signature -> mo qismi MIYONA-ro mekhonem.
//  In faqat baroi namoish ast - haqiqat hamesha az server meoyad.
// ------------------------------------------------------------
export type TokenUser = {
  sub: string; // userId
  userName: string;
  email: string;
  exp: number; // vaqti tamomshavi (sekund)
};

export function readToken(token: string): TokenUser | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    // base64url -> base64. DIQQAT: "=" ham lozim ast, be on
    // atob() dar ba'ze token-ho khato mepartoyad.
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

    return JSON.parse(atob(padded)) as TokenUser;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const user = readToken(token);
  if (user === null) return true;

  // 30 soniya zakhira - to token daruni khudi so-rov tamom nashavad
  return user.exp * 1000 <= Date.now() + 30_000;
}

/**
 * Token-i ZINDA-i korbar, yo `null`.
 * Agar token guzashta bosad - onro darhol toza mekunem.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  let saved: string | null = null;
  try {
    saved = localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // browser localStorage-ro band kardaast
  }

  if (saved === null || saved === "") return null;

  if (isTokenExpired(saved)) {
    clearToken();
    return null;
  }

  return saved;
}

export function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage band ast - kori digar karda nametavonem
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // guzoshtan
  }
}

/**
 * Baromadan: token toza va ba sahifai login.
 *
 * DIQQAT: `replace` (na `href`) - to tugmai "aqib"-i browser
 * korbarro ba sahifai basta baz nagardonad.
 */
export function logout() {
  clearToken();
  if (typeof window === "undefined") return;
  window.location.replace(LOGIN_PATH);
}

/**
 * Server guft 401 (token guzasht yo qalb ast).
 *
 * Faqat YAK BOR ba login mefiristem: dar yak sahifa metavonad
 * 5-6 so-rov yakbora 401 girad, va bе in nishona har yak
 * `replace` mekard -> browser meistod.
 */
let redirecting = false;

export function onUnauthorized() {
  if (typeof window === "undefined") return;
  if (redirecting) return;

  // Dar khudi sahifai login boz ba login firistodan - halqai beoxir
  if (window.location.pathname.startsWith("/Auth")) return;

  redirecting = true;
  clearToken();

  // Ba'di daromadan korbar ba HAMON sahifa bar megardad
  const back = window.location.pathname + window.location.search;
  const next = back === "/" ? "" : `?next=${encodeURIComponent(back)}`;

  window.location.replace(`${LOGIN_PATH}${next}`);
}
