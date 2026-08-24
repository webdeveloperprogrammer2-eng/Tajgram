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

  useEffect(() => {
    let alive = true;

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
