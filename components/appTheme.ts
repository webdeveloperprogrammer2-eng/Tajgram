"use client";

// ============================================================
//  components/appTheme.ts
//
//  Naql (torik/ravshan) va baromadan - YAK JOI UMUMI.
//
//  CHARO?
//  Pesh har modul (/chats, /profile, /reels) sidebar-i KHUDASH
//  doshт va tugmai naql/baromadan dar hamon jo bud. Hozir
//  sidebar YAKTOST (components/Sidebar.tsx), baroi hamin in
//  du amal boyad az yak joi umumi kor kunad.
//
//  Kalidho ayni hamonhoe ki Auth va modulho istifoda mebarand.
// ============================================================

// Konstantaho dar themeKeys.ts hastand (server ham az hamon jo mekhonad),
// in jo faqat bar megardonem - to importhoi kuhna nashikanand.
import { THEME_EVENT, THEME_KEY, TOKEN_KEY, type AppTheme } from "./themeKeys";

export { THEME_EVENT, THEME_KEY, TOKEN_KEY };
export type { AppTheme };

export function readTheme(): AppTheme {
  if (typeof localStorage === "undefined") return "dark";

  const saved = localStorage.getItem(THEME_KEY);
  return saved === "light" ? "light" : "dark";
}

// Cookie-ro server dar aввали render mekhonad -> foni safed "chashmak" namezanad
export function syncThemeCookie(theme: AppTheme) {
  if (typeof document === "undefined") return;

  document.cookie = `${THEME_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function writeTheme(theme: AppTheme) {
  if (typeof localStorage === "undefined") return;

  localStorage.setItem(THEME_KEY, theme);
  syncThemeCookie(theme);
  window.dispatchEvent(new CustomEvent<AppTheme>(THEME_EVENT, { detail: theme }));
}

export function toggleAppTheme(): AppTheme {
  const next: AppTheme = readTheme() === "dark" ? "light" : "dark";
  writeTheme(next);
  return next;
}

// Provider-hoi modulho ba hamin gush medihand
export function onThemeChange(listener: (theme: AppTheme) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<AppTheme>).detail;
    listener(detail === "light" ? "light" : "dark");
  };

  window.addEventListener(THEME_EVENT, handler);
  return () => window.removeEventListener(THEME_EVENT, handler);
}

export function logoutEverywhere() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // guzoshtan
  }
  window.location.href = "/Auth/login";
}
