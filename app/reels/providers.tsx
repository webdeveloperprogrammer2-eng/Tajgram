"use client";

// ============================================================
//  app/reels/providers.tsx
//  "Maghzi" papkai reels.
//
//  In jo nigoh doshta meshavand:
//    1. THEME - torik yo ravshan (ayni kalidi hamai sayt)
//    2. TOKEN - az localStorage ("tajgram_token")
//    3. Lentai REELS: HAMA / PODPISKAHO / SAQLSHUDA
//       (sahifa ba sahifa - hangomi ba poyon rasidan boz meoyad)
//    4. Sadọ: khomush yo ne (yak baroi hamai videoho)
//
//  HAMAI ma'lumot AZ SERVER meoyad (GET /Reels/...).
//  Hech video-i soakhta (demo) in jo NEST.
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";

import {
  ApiError,
  errorText,
  getFavoriteReels,
  getFollowingReels,
  getMyProfile,
  getReels,
  type MyProfile,
  type Reel,
} from "./api";
import { getToken, isTokenExpired, removeToken } from "./token";
import { onThemeChange, toggleAppTheme } from "@/components/appTheme";
import { tr } from "@/components/appLang";

export type Theme = "dark" | "light";
export type Feed = "all" | "following" | "saved";
export type Status = "loading" | "guest" | "ready" | "error";

// Ayni kalidi Auth va profile - naql dar hamai sayt yakkhela
const THEME_KEY = "tajgram_theme";

// Dar yak so-rov chand video meoyad
const PAGE_SIZE = 6;

type ReelsState = {
  theme: Theme;
  toggleTheme: () => void;

  status: Status;
  error: string;
  token: string;
  me: MyProfile | null;

  feed: Feed;
  changeFeed: (next: Feed) => void;

  reels: Reel[];
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;

  muted: boolean;
  toggleMuted: () => void;

  // navsozii DARHOL (like, saqlshuda, prosmotr)
  patchReel: (reelsId: number, patch: Partial<Reel>) => void;

  reload: () => Promise<void>;
  logout: () => void;
};

const ReelsContext = createContext<ReelsState | null>(null);

// Kadom feed kadom so-rovro mefiristad
function fetchFeed(feed: Feed, token: string, page: number) {
  if (feed === "following") return getFollowingReels(token, page, PAGE_SIZE);
  if (feed === "saved") return getFavoriteReels(token, page, PAGE_SIZE);
  return getReels(token, page, PAGE_SIZE);
}

export function ReelsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [muted, setMuted] = useState(true); // browser autoplay-i sadọdorro band mekunad

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [me, setMe] = useState<MyProfile | null>(null);

  const [feed, setFeed] = useState<Feed>("all");
  const [reels, setReels] = useState<Reel[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ------------------------------------------------------------
  //  Bori avval (yo ba'di ivazi feed)
  // ------------------------------------------------------------
  async function loadFirst(activeToken: string, activeFeed: Feed) {
    setStatus("loading");
    setError("");
    setPage(1);
    setHasMore(true);

    try {
      const [profile, list] = await Promise.all([
        getMyProfile(activeToken).catch(() => null),
        fetchFeed(activeFeed, activeToken, 1),
      ]);

      setMe(profile);

      const clean = Array.isArray(list) ? list.filter(hasVideo) : [];
      setReels(clean);
      setHasMore(Array.isArray(list) && list.length >= PAGE_SIZE);
      setStatus("ready");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        removeToken();
        setToken("");
        setStatus("guest");
        return;
      }

      setError(errorText(err, tr().unknownError));
      setStatus("error");
    }
  }

  // ------------------------------------------------------------
  //  Sahifai navbati (hangomi ba akhiri lenta rasidan)
  // ------------------------------------------------------------
  async function loadMore() {
    if (loadingMore || !hasMore || status !== "ready") return;

    setLoadingMore(true);

    try {
      const next = page + 1;
      const list = await fetchFeed(feed, token, next);
      const clean = Array.isArray(list) ? list.filter(hasVideo) : [];

      // Takrorhoro nameguzorem (server ba'zan yak videoro du bor medihad)
      setReels((old) => {
        const seen = new Set(old.map((item) => item.reelsId));
        return [...old, ...clean.filter((item) => !seen.has(item.reelsId))];
      });

      setPage(next);
      setHasMore(Array.isArray(list) && list.length >= PAGE_SIZE);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }

  // ---------- Yakum bor: naql va token ----------
  // Holatro daruni queueMicrotask meguzorem - to render-i joriro
  // az nav nakashad (hamon usuli components/Sidebar.tsx).
  useEffect(() => {
    queueMicrotask(() => {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") setTheme(saved);

      // Token-i KHUDI korbar. Agar naboshad yo guzashta bosad -
      // "guest" NAMESHAVEM: proxy khudash bo akkaunti khizmati medarod,
      // aynan hamon tavr ki lentai asosi (/api/backend) kor mekunad.
      // "Avval daroed" faqat on vaqt paydo meshavad, ki server-i
      // haqiqi 401 dihad (dar catch-i loadFirst).
      const stored = getToken();
      const mine = stored !== null && !isTokenExpired(stored) ? stored : "";
      if (stored !== null && mine === "") removeToken();

      setToken(mine);
      void loadFirst(mine, "all");
    });
  }, []);

  // Naql az sidebar-i UMUMI ivaz meshavad -> in jo khabar megirem
  useEffect(() => onThemeChange(setTheme), []);

  const value: ReelsState = {
    theme,
    toggleTheme: () => setTheme(toggleAppTheme()),

    status,
    error,
    token,
    me,

    feed,
    changeFeed: (next) => {
      if (next === feed || token === "") return;
      setFeed(next);
      setReels([]);
      loadFirst(token, next);
    },

    reels,
    loadingMore,
    hasMore,
    loadMore,

    muted,
    toggleMuted: () => setMuted((old) => !old),

    patchReel: (reelsId, patch) =>
      setReels((old) =>
        old.map((item) =>
          item.reelsId === reelsId ? { ...item, ...patch } : item
        )
      ),

    reload: () => loadFirst(token, feed),

    logout: () => {
      removeToken();
      setToken("");
      setMe(null);
      setReels([]);
      setStatus("guest");
    },
  };

  return (
    <ReelsContext.Provider value={value}>{children}</ReelsContext.Provider>
  );
}

// Be video reels ma'ni nadorad - chunin satrhoro nishon namedihem
function hasVideo(reel: Reel): boolean {
  return typeof reel.videoName === "string" && reel.videoName !== "";
}

export function useReels(): ReelsState {
  const value = useContext(ReelsContext);
  if (value === null) {
    throw new Error("useReels faqat daruni <ReelsProvider> kor mekunad");
  }
  return value;
}
