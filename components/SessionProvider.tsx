"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { TOKEN_KEY } from "./appTheme";
import type { UnreadCount, UserProfile } from "@/lib/types";

type SessionValue = {
  me: UserProfile | null;
  unread: UnreadCount | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionValue>({
  me: null,
  unread: null,
  loading: true,
  refresh: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

/**
 * Профиль текущего пользователя и счётчики. Авторизацию берёт на себя
 * серверный прокси, поэтому здесь нет ни токенов, ни экрана входа.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<UserProfile | null>(null);
  const [unread, setUnread] = useState<UnreadCount | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [profile, counts] = await Promise.all([
        api.myProfile(),
        api.unreadCount().catch(() => null),
      ]);
      setMe(profile.data);
      setUnread(counts?.data ?? null);
    } catch {
      /* интерфейс работает и без профиля — покажем заглушки */
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Разделы команды (chats, reels, profile, search) ходят на бэкенд напрямую и
   * берут токен из localStorage. Логина у нас нет, поэтому кладём туда тот же
   * служебный токен, которым пользуется серверный прокси — иначе их страницы
   * показывают пустой экран.
   */
  useEffect(() => {
    let alive = true;

    const ensureToken = async () => {
      try {
        if (localStorage.getItem(TOKEN_KEY)) return;

        const response = await fetch("/api/session", { cache: "no-store" });
        const json = (await response.json()) as { data?: string | null };
        if (!alive || typeof json.data !== "string") return;

        localStorage.setItem(TOKEN_KEY, json.data);

        // Их страницы читают токен только при монтировании — один раз обновим.
        if (!sessionStorage.getItem("tajgram_token_ready")) {
          sessionStorage.setItem("tajgram_token_ready", "1");
          window.location.reload();
        }
      } catch {
        /* без токена разделы команды просто попросят войти */
      }
    };

    void ensureToken();

    Promise.all([api.myProfile(), api.unreadCount().catch(() => null)])
      .then(([profile, counts]) => {
        if (!alive) return;
        setMe(profile.data);
        setUnread(counts?.data ?? null);
      })
      .catch(() => {
        /* интерфейс работает и без профиля — покажем заглушки */
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <SessionContext.Provider value={{ me, unread, loading, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}
