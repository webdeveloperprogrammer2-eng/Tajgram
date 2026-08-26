"use client";

// ============================================================
//  app/Auth/providers.tsx
//  In jo DU chizro nigoh medorem va ba hamai component-ho medihem:
//    1. THEME  - torik yo ravshan
//    2. LANG   - zaboni sayt (tj / ru / en)
//  Har du dar localStorage nigoh doshta meshavand,
//  ki ba'di nav kardani sahifa faromush nashavand.
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";
import { dictionary, type Dict, type Lang } from "./i18n";

export type Theme = "dark" | "light";

const THEME_KEY = "tajgram_theme";
const LANG_KEY = "tajgram_lang";

// Shakli ma'lumoti ki taqsim mekunem
type Settings = {
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  changeLang: (next: Lang) => void;
  t: Dict; // matnhoi zaboni intikhobshuda
};

// "Quti"-i umumi (Context)
const SettingsContext = createContext<Settings | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Qimathoi ibtidoi (server hamin-horo mebinad)
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLang] = useState<Lang>("tj");

  // Faqat YAK bor, ba'di kushodani sahifa:
  // az localStorage intikhobi kuhnai korbarro megirem.
  useEffect(() => {
    queueMicrotask(() => {
      const savedTheme = localStorage.getItem(THEME_KEY);
      const savedLang = localStorage.getItem(LANG_KEY);

      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
      if (savedLang === "tj" || savedLang === "ru" || savedLang === "en") {
        setLang(savedLang);
      }
    });
  }, []);

  // Ivaz kardani theme + darhol nigoh doshtan
  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  }

  // Ivaz kardani zabon + darhol nigoh doshtan
  function changeLang(next: Lang) {
    setLang(next);
    localStorage.setItem(LANG_KEY, next);
  }

  const value: Settings = {
    theme,
    toggleTheme,
    lang,
    changeLang,
    t: dictionary[lang], // matnho ba zaboni intikhobshuda
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// ------------------------------------------------------------
//  Hook: dar har component "const { t, theme } = useSettings()"
// ------------------------------------------------------------
export function useSettings(): Settings {
  const context = useContext(SettingsContext);

  if (context === null) {
    throw new Error("useSettings boyad daruni <AuthProvider> istifoda shavad.");
  }

  return context;
}
