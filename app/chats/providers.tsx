"use client";

// ============================================================
//  app/chats/providers.tsx
//  "Maghzi" papkai chats.
//
//  In jo nigoh doshta meshavand:
//    1. THEME - torik yo ravshan (ayni kalidi hamai sayt)
//    2. TOKEN - az localStorage ("tajgram_token")
//    3. Ro-ykhati chatho, payomho va RO-YKHATI IJOZAT
//
//  QOIDAI ASOSI:
//    navishtan FAQAT bo onhoe mumkin ast ki
//      - ba man podpiska kardaand (get-subscribers), yo
//      - man ba onho podpiska kardaam (get-subscriptions)
//    In ro-ykhat "allowed" nomida meshavad.
//
//  HAMAI ma'lumot AZ SERVER meoyad - hech chizi soakhta nest.
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";

import {
  ApiError,
  errorText,
  getChats,
  getMyProfile,
  getSubscribers,
  getSubscriptions,
  type Chat,
  type FollowUser,
  type MyProfile,
} from "./api";
import { getToken, isTokenExpired, removeToken } from "./token";
import { onThemeChange, readTheme, toggleAppTheme } from "@/components/appTheme";

export type Theme = "dark" | "light";

export type Status = "loading" | "guest" | "ready" | "error";

type ChatsState = {
  theme: Theme;
  toggleTheme: () => void;

  status: Status;
  error: string;
  token: string;

  me: MyProfile | null;
  chats: Chat[];

  // Onhoe ki bo onho navishtan MUMKIN ast (podpiska ba du taraf)
  allowed: FollowUser[];
  allowedIds: Set<string>;

  reload: () => Promise<void>;
  reloadChats: () => Promise<void>;
  logout: () => void;
};

const ChatsContext = createContext<ChatsState | null>(null);

export function ChatsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const [me, setMe] = useState<MyProfile | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [allowed, setAllowed] = useState<FollowUser[]>([]);

  // ------------------------------------------------------------
  //  Hamai ma'lumotro az server megirem.
  // ------------------------------------------------------------
  async function loadEverything(activeToken: string) {
    setStatus("loading");
    setError("");

    try {
      // 1) Man ki hastam? (userId baroi so-rovhoi podpiska lozim ast)
      const profile = await getMyProfile(activeToken);
      setMe(profile);

      // 2) Chatho + du ro-ykhati podpiska - YAKBORA
      const [myChats, subscribers, subscriptions] = await Promise.all([
        getChats(activeToken).catch(() => []),
        getSubscribers(activeToken, profile.userId).catch(() => []),
        getSubscriptions(activeToken, profile.userId).catch(() => []),
      ]);

      setChats(Array.isArray(myChats) ? sortChats(myChats) : []);

      // 3) Du ro-ykhatro yakjo mekunem, takrorhoro tark mekunem
      const merged = new Map<string, FollowUser>();
      for (const user of [
        ...(Array.isArray(subscribers) ? subscribers : []),
        ...(Array.isArray(subscriptions) ? subscriptions : []),
      ]) {
        if (user && user.userId && user.userId !== profile.userId) {
          merged.set(user.userId, user);
        }
      }
      setAllowed([...merged.values()]);

      setStatus("ready");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        removeToken();
        setToken("");
        setStatus("guest");
        return;
      }

      setError(errorText(err, "Khatoi nomalum dar server."));
      setStatus("error");
    }
  }

  // Faqat ro-ykhati chatho (ba'di firistodani payom yo har 8 soniya)
  async function reloadChats() {
    if (token === "") return;

    try {
      const list = await getChats(token);
      setChats(Array.isArray(list) ? sortChats(list) : []);
    } catch {
      // khomush - ro-ykhati kuhna dar joyash memonad
    }
  }

  // ---------- Yakum bor: naql va token ----------
  // Holatro daruni queueMicrotask meguzorem - to render-i joriro
  // az nav nakashad (hamon usuli components/Sidebar.tsx).
  useEffect(() => {
    queueMicrotask(() => {
      setTheme(readTheme());

      const stored = getToken();

      if (stored === null || isTokenExpired(stored)) {
        if (stored !== null) removeToken();
        setStatus("guest");
        return;
      }

      setToken(stored);
      void loadEverything(stored);
    });
  }, []);

  // Naql az sidebar-i UMUMI ivaz meshavad -> in jo khabar megirem.
  // DIQQAT: in jo ba localStorage HECH CHIZ NAMENAVISEM - navishtan
  // faqat dar components/appTheme.ts (writeTheme) ast. Peshtar in jo
  // hangomi bor shudan "dark"-ro menavisht va naqli ravshanro mekusht.
  useEffect(() => onThemeChange(setTheme), []);

  const value: ChatsState = {
    theme,
    toggleTheme: () => setTheme(toggleAppTheme()),

    status,
    error,
    token,

    me,
    chats,

    allowed,
    allowedIds: new Set(allowed.map((user) => user.userId)),

    reload: () => loadEverything(token),
    reloadChats,

    logout: () => {
      removeToken();
      setToken("");
      setMe(null);
      setChats([]);
      setAllowed([]);
      setStatus("guest");
    },
  };

  return (
    <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>
  );
}

// Chathoi nav dar bolo boshand
function sortChats(list: Chat[]): Chat[] {
  return [...list].sort((a, b) => {
    const left = new Date(a.lastMessageDate ?? a.createdAt).getTime();
    const right = new Date(b.lastMessageDate ?? b.createdAt).getTime();
    return right - left;
  });
}

export function useChats(): ChatsState {
  const value = useContext(ChatsContext);
  if (value === null) {
    throw new Error("useChats faqat daruni <ChatsProvider> kor mekunad");
  }
  return value;
}
