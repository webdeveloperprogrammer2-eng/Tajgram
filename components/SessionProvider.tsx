"use client";

// ============================================================
//  components/SessionProvider.tsx
//
//  "Man ki hastam?" - YAK JOI YAGONA baroi tamomi sayt.
//
//  ============================================================
//  IN JO YAK KHATOI KALON BUD:
//
//  Peshtar in fayl, agar token naboshad, az /api/session
//  token-i akkaunti KHIZMATI (dilovar06)-ro megirift, ba
//  localStorage meguzosht va sahifaro AZ NAV bor mekard
//  (window.location.reload()). Ya'ne:
//    - har mehmon be login khud-ba-khud "daromada" meshud;
//    - hamai amalho (like, komment, post) az nomi odami
//      DIGAR mearaftand;
//    - "baromadan" kor namekard - sahifa boz hamon
//      akkauntro megirift;
//    - gohe reload-i beoxir meshud.
//
//  Instagram chunin namekunad. Hozir: token nest -> login.
//  ============================================================
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useCall } from "@/app/chats/call/CallProvider";
import { api } from "@/lib/api";
import { getToken, logout as logoutEverywhere } from "@/lib/auth";
import type { UnreadCount, UserProfile } from "@/lib/types";

type SessionValue = {
  /** Profili KHUDI korbar. `null` = hanuz nayomadaast yo mehmon. */
  me: UserProfile | null;
  unread: UnreadCount | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
};

const SessionContext = createContext<SessionValue>({
  me: null,
  unread: null,
  loading: true,
  refresh: async () => {},
  logout: logoutEverywhere,
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  // <CallProvider> dar app/layout.tsx (daruni <GlobalCall>) ast va
  // HAMESHA balotar az in provider meistad - baroi hamin in jo
  // payvasti zindai /realtime allakay tayyor ast.
  const { onChatEvent } = useCall();

  const [me, setMe] = useState<UserProfile | null>(null);
  const [unread, setUnread] = useState<UnreadCount | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // Token nest -> so-rov ham namefiristem. lib/api.ts khudash
    // 401-ro girifta ba /Auth/login mefiristad, vale bе in
    // sanjish behuda yak so-rovi shabakavi merfat.
    if (getToken() === null) {
      setMe(null);
      setUnread(null);
      setLoading(false);
      return;
    }

    try {
      const [profile, counts] = await Promise.all([
        api.myProfile(),
        api.unreadCount().catch(() => null),
      ]);
      setMe(profile.data);
      setUnread(counts?.data ?? null);
    } catch {
      // 401-ro allakay lib/api.ts kor kard (ba login firistod).
      // Khatoi digar - sahifa be profil ham kor mekunad.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const refreshUnread = useCallback(() => {
    api
      .unreadCount()
      .then((response) => setUnread(response.data ?? null))
      .catch(() => {
        /* shabaka gohe qat' meshavad - muhim nest */
      });
  }, []);

  // ---------- FAVRAN ----------
  // Peshtar raqami payomho FAQAT har 45 soniya nav meshud: kase ba
  // shumo menavisht, vale dar sidebar to nim daqiqa HECH CHIZ
  // namoyon nameshud. Hozir hamon dam ki backend "chat:message"-ro
  // ba WebSocket mefiristad, hisobro az nav mekhonem.
  useEffect(() => {
    if (me === null) return;
    return onChatEvent(() => refreshUnread());
  }, [me, onChatEvent, refreshUnread]);

  // Ogohinomahoi "like"/"obuna" az WebSocket namebaroyand -
  // baroi onho sanjishi davri memonad (vale tezar: 20 soniya).
  useEffect(() => {
    if (me === null) return;

    const timer = setInterval(refreshUnread, 20_000);
    return () => clearInterval(timer);
  }, [me, refreshUnread]);

  // Ba varaq bar gashtem -> darhol sanjish (telefon vaqte varaq
  // penhon ast taymerhoro khob mekunonad).
  useEffect(() => {
    if (me === null) return;

    function onVisible() {
      if (document.visibilityState === "visible") refreshUnread();
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [me, refreshUnread]);

  return (
    <SessionContext.Provider
      value={{ me, unread, loading, refresh: load, logout: logoutEverywhere }}
    >
      {children}
    </SessionContext.Provider>
  );
}
