"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onThemeChange,
  readTheme,
  writeTheme,
  type AppTheme,
} from "./appTheme";
import {
  dictionary,
  onLangChange,
  readLang,
  writeLang,
  type Dict,
  type Lang,
} from "./appLang";

type LocaleValue = {
  lang: Lang;
  t: Dict;
  setLang: (lang: Lang) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
};

const LocaleContext = createContext<LocaleValue>({
  lang: "tj",
  t: dictionary.tj,
  setLang: () => {},
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useT() {
  return useContext(LocaleContext);
}

/**
 * Один источник правды для темы и языка на весь сайт.
 *
 * Раньше каждый раздел (/chats, /profile, /reels, /search) держал свою тему
 * и писал в <html> собственный атрибут, а мои страницы вообще были всегда
 * светлыми — отсюда «на других страницах темнеет». Теперь тема и язык
 * лежат в общих ключах (tajgram_theme / tajgram_lang), а <html> получает
 * data-theme, который читают и мои страницы, и разделы команды.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("tj");
  const [theme, setThemeState] = useState<AppTheme>("dark");

  // Значения из localStorage доступны только в браузере.
  useEffect(() => {
    queueMicrotask(() => {
      setLangState(readLang());
      setThemeState(readTheme());
    });
  }, []);

  // Кто-то (другой раздел) поменял тему или язык — подхватываем.
  useEffect(() => {
    const offTheme = onThemeChange(setThemeState);
    const offLang = onLangChange(setLangState);
    return () => {
      offTheme();
      offLang();
    };
  }, []);

  // Красим весь документ, а не отдельный раздел.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang === "tj" ? "tg" : lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    writeLang(next);
    setLangState(next);
  }, []);

  const setTheme = useCallback((next: AppTheme) => {
    writeTheme(next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(readTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return (
    <LocaleContext.Provider
      value={{
        lang,
        t: dictionary[lang],
        setLang,
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}
