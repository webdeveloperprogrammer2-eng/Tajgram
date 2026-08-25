"use client";

// ============================================================
//  ThemeSync - naqlro dar <html> meguzorad.
//  YAK JOI umumi baroi TAMOMI sayt: /, /chats, /profile,
//  /reels, /search, /Auth - hama az hamin mekhonand.
//
//  Naqli AVVALIN-ro server az cookie meguzorad (app/layout.tsx),
//  in jo faqat sinxron mekunem: localStorage -> cookie -> <html>.
// ============================================================

import { useEffect } from "react";

import { onThemeChange, readTheme, syncThemeCookie } from "./appTheme";

export function ThemeSync() {
  useEffect(() => {
    const put = (theme: string) => {
      document.documentElement.setAttribute("data-theme", theme);
      syncThemeCookie(theme === "light" ? "light" : "dark");
    };

    put(readTheme());
    return onThemeChange(put);
  }, []);

  return null;
}
