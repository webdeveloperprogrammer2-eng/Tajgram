"use client";

// ============================================================
//  app/profile/providers.tsx
//  "Maghzi" papkai profile.
//
//  In jo nigoh doshta meshavand:
//    1. THEME  - torik yo ravshan
//    2. TOKEN  - az localStorage ("tajgram_token")
//    3. Ma'lumoti korbar: profil, postho, reels, storyho
//
//  HAMAI ma'lumot AZ SERVER meoyad.
//  Hech chizi soakhta (test/demo) in jo nest.
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";

import {
  ApiError,
  errorText,
  getMyPosts,
  getMyProfile,
  getMyReels,
  getMyStories,
  type Post,
  type Reel,
  type Story,
  type UserProfile,
} from "./api";
import { getToken, removeToken } from "./token";
import { onThemeChange, toggleAppTheme } from "@/components/appTheme";

export type Theme = "dark" | "light";

// Ayni kalidi Auth - ki naql (theme) dar hamai sayt yakkhela bosad
const THEME_KEY = "tajgram_theme";

// Holati sahifa:
//   "loading" - hanuz ma'lumot meoyad
//   "guest"   - token nest -> boyad login kunad
//   "ready"   - hama chiz omad
//   "error"   - server khato dod
export type Status = "loading" | "guest" | "ready" | "error";

type ProfileState = {
  theme: Theme;
  toggleTheme: () => void;

  status: Status;
  error: string;
  token: string;

  profile: UserProfile | null;
  posts: Post[];
  reels: Reel[];
  stories: Story[];

  reload: () => Promise<void>;
  logout: () => void;

  // navsozii DARHOL - baroi like va prosmotr
  patchPost: (postId: number, patch: Partial<Post>) => void;
  patchReel: (reelsId: number, patch: Partial<Reel>) => void;
  setProfile: (next: UserProfile) => void;
};

const ProfileContext = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // ---------- NAQL (theme) ----------
  const [theme, setTheme] = useState<Theme>("dark");

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [stories, setStories] = useState<Story[]>([]);

  // ------------------------------------------------------------
  //  Hamai ma'lumotro az server megirem.
  //  Promise.all - har 4 so-rov YAKBORA meravand (tezar).
  // ------------------------------------------------------------
  async function loadEverything(activeToken: string) {
    setStatus("loading");
    setError("");

    try {
      // Profil chizi ASOSI ast - agar in nashud, sahifa ma'ni nadorad.
      const me = await getMyProfile(activeToken);
      setProfile(me);

      // Postho, reels va storyho - agar YAKash khato dihad,
      // digarho bo hamin ham namoyon shavand.
      const [myPosts, myReels, myStories] = await Promise.all([
        getMyPosts(activeToken).catch(() => []),
        getMyReels(activeToken).catch(() => []),
        getMyStories(activeToken).catch(() => []),
      ]);

      setPosts(Array.isArray(myPosts) ? myPosts : []);
      setReels(Array.isArray(myReels) ? myReels : []);
      setStories(Array.isArray(myStories) ? myStories : []);

      setStatus("ready");
    } catch (err) {
      // 401 = token kor namekunad -> korbar boyad az nav login kunad
      if (err instanceof ApiError && err.status === 401) {
        removeToken();
        setToken("");
        setStatus("guest");
        return;
      }

      setError(
        errorText(err, "Khatoi nomalum dar server.")
      );
      setStatus("error");
    }
  }

  // Faqat YAK bor, ba'di kushodani sahifa.
  // Holatro daruni queueMicrotask meguzorem - to render-i joriro
  // az nav nakashad (hamon usuli components/Sidebar.tsx).
  useEffect(() => {
    queueMicrotask(() => {
      // 1) Naqli kuhna
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);

      // 2) Token-i KHUDI korbar.
      //
      //    Peshtar in jo mantiqi khatarnok bud: agar token naboshad,
      //    BOZ HAM so-rov merfat - chunki proxy khudash bo akkaunti
      //    KHIZMATI (dilovar06) medaromad. Ya'ne dar sahifai "profili
      //    MAN" ma'lumoti odami DIGAR namoyon meshud.
      //
      //    Hozir akkaunti khizmati nest, va korbari nadaromadaro
      //    components/AppFrame.tsx allakay ba /Auth/login firistodaast -
      //    baroi hamin in jo token qariban hamesha hast.
      const mine = getToken();

      if (mine === null) {
        setStatus("guest");
        return;
      }

      setToken(mine);
      void loadEverything(mine);
    });
  }, []);

  function toggleTheme() {
    setTheme(toggleAppTheme());
  }

  // Naql az sidebar-i UMUMI ivaz meshavad -> in jo khabar megirem
  useEffect(() => onThemeChange(setTheme), []);

  // Ma'lumotro az server az nav megirem
  async function reload() {
    if (token === "") return;
    await loadEverything(token);
  }

  function logout() {
    removeToken();
    setToken("");
    setProfile(null);
    setPosts([]);
    setReels([]);
    setStories([]);
    setStatus("guest");
  }

  // Yak postro dar ro-ykhat ivaz mekunem (be so-rovi nav ba server)
  function patchPost(postId: number, patch: Partial<Post>) {
    setPosts((list) =>
      list.map((item) => (item.postId === postId ? { ...item, ...patch } : item))
    );
  }

  function patchReel(reelsId: number, patch: Partial<Reel>) {
    setReels((list) =>
      list.map((item) =>
        item.reelsId === reelsId ? { ...item, ...patch } : item
      )
    );
  }

  const value: ProfileState = {
    theme,
    toggleTheme,
    status,
    error,
    token,
    profile,
    posts,
    reels,
    stories,
    reload,
    logout,
    patchPost,
    patchReel,
    setProfile,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

// ------------------------------------------------------------
//  Hook: dar har component ->  const { profile, posts } = useProfile()
// ------------------------------------------------------------
export function useProfile(): ProfileState {
  const context = useContext(ProfileContext);

  if (context === null) {
    throw new Error("useProfile boyad daruni <ProfileProvider> istifoda shavad.");
  }

  return context;
}
