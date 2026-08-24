"use client";

// ============================================================
//  ReelsShell - ramkai umumi baroi /reels.
//  Ayni hamon dizayni /profile va /chats:
//  sidebar-i chap (kompyuter) + qatori boloi shishagi (telefon).
// ============================================================
import { useEffect } from "react";
import Link from "next/link";
import {
  Bookmark,
  Compass,
  Film,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  PlusSquare,
  Search,
  Sun,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";

import { ReelsProvider, useReels } from "../providers";
import styles from "../reels.module.css";

export default function ReelsShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReelsProvider>
      <Frame>{children}</Frame>
    </ReelsProvider>
  );
}

// Nuqtahoi hanuz sahifanadosht
const NAV = [
  { key: "home", label: "Asosi", icon: Home },
  { key: "explore", label: "Kashf", icon: Compass },
  { key: "likes", label: "Bayanho", icon: Heart },
  { key: "create", label: "Guzoshtan", icon: PlusSquare },
  { key: "saved", label: "Saqlshuda", icon: Bookmark },
];

function Frame({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme, status, logout, me, muted, toggleMuted } =
    useReels();

  useEffect(() => {
    document.documentElement.setAttribute("data-reels-theme", theme);
    return () => {
      document.documentElement.removeAttribute("data-reels-theme");
    };
  }, [theme]);

  return (
    <div data-theme={theme} className={`${styles.shell} relative h-screen`}>
      <span className={styles.aura} aria-hidden />

      {/* ================= SIDEBAR (kompyuter) ================= */}
      <aside
        className={`${styles.sidebar} fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col px-3 py-6 md:flex xl:w-[248px] xl:px-4`}
      >
        <Link href="/profile" className="mb-8 flex items-center gap-3 px-2 xl:px-3">
          <span
            className={`${styles.gradBg} flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-sm font-black`}
          >
            T
          </span>
          <span
            className={`${styles.gradText} hidden text-xl font-black tracking-tight xl:inline`}
          >
            Tajgram
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <span
              key={item.key}
              className={`${styles.navItem} ${styles.navItemSoon}`}
              title="Ba zudi"
            >
              <item.icon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              <span className="hidden text-sm xl:inline">{item.label}</span>
            </span>
          ))}

          <Link href="/search" className={styles.navItem}>
            <Search className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            <span className="hidden text-sm xl:inline">Justuju</span>
          </Link>

          {/* REELS - hamin sahifa */}
          <span className={`${styles.navItem} ${styles.navItemActive}`}>
            <Film className="h-6 w-6 shrink-0" strokeWidth={2} />
            <span className="hidden text-sm xl:inline">Reels</span>
          </span>

          <Link href="/chats" className={styles.navItem}>
            <MessageCircle className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            <span className="hidden text-sm xl:inline">Payomho</span>
          </Link>

          <Link href="/profile" className={styles.navItem}>
            <User className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            <span className="hidden text-sm xl:inline">Profil</span>
          </Link>
        </nav>

        <div className="mt-4 flex flex-col gap-1 border-t border-[var(--line)] pt-4">
          <button type="button" onClick={toggleMuted} className={styles.navItem}>
            {muted ? (
              <VolumeX className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            ) : (
              <Volume2 className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            )}
            <span className="hidden text-sm xl:inline">
              {muted ? "Sadọro kushoed" : "Sadọ khomush"}
            </span>
          </button>

          <button type="button" onClick={toggleTheme} className={styles.navItem}>
            {theme === "dark" ? (
              <Sun className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            ) : (
              <Moon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            )}
            <span className="hidden text-sm xl:inline">
              {theme === "dark" ? "Naqli ravshan" : "Naqli torik"}
            </span>
          </button>

          {status === "ready" && (
            <button type="button" onClick={logout} className={styles.navItem}>
              <LogOut className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              <span className="hidden text-sm xl:inline">Baromadan</span>
            </button>
          )}

          <span className={`${styles.navItem} ${styles.navItemSoon}`}>
            <Menu className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            <span className="hidden text-sm xl:inline">Boz ham</span>
          </span>
        </div>
      </aside>

      {/* ================= QATORI BOLO (telefon) ================= */}
      <header
        className={`${styles.topBar} fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`${styles.gradBg} flex h-7 w-7 items-center justify-center rounded-[10px] text-xs font-black`}
          >
            T
          </span>
          <span className={`${styles.gradText} text-lg font-black tracking-tight`}>
            Reels
          </span>
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleMuted}
            aria-label="Sadọ"
            className={styles.iconBtn}
          >
            {muted ? (
              <VolumeX className="h-5 w-5" strokeWidth={1.8} />
            ) : (
              <Volume2 className="h-5 w-5" strokeWidth={1.8} />
            )}
          </button>

          <Link href="/profile" aria-label="Profil" className="p-1.5">
            <span
              className={`${styles.gradBg} flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black`}
            >
              {(me?.userName ?? "T").slice(0, 1).toUpperCase()}
            </span>
          </Link>
        </div>
      </header>

      {/* ================= QISMI ASOSI ================= */}
      <main className="relative z-10 h-full pt-[56px] md:pl-[76px] md:pt-0 xl:pl-[248px]">
        {children}
      </main>
    </div>
  );
}
