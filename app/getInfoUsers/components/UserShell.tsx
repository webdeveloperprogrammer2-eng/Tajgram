"use client";

// ============================================================
//  UserShell - ramkai umumi baroi /getInfoUsers.
//  Ayni hamon dizayni /profile: sidebar-i chap + qatori boloi telefon.
//  Naql (dark/light) az localStorage girifta meshavad.
// ============================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Compass,
  Film,
  Heart,
  Home,
  MessageCircle,
  Moon,
  PlusSquare,
  Search,
  Sun,
  User,
} from "lucide-react";

import styles from "../user.module.css";

const THEME_KEY = "tajgram_theme";

// Nuqtahoi hanuz sahifanadosht
const NAV = [
  { key: "home", label: "Asosi", icon: Home },
  { key: "explore", label: "Kashf", icon: Compass },
  { key: "likes", label: "Bayanho", icon: Heart },
  { key: "create", label: "Guzoshtan", icon: PlusSquare },
  { key: "saved", label: "Saqlshuda", icon: Bookmark },
];

export default function UserShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  }

  return (
    <div data-theme={theme} className={`${styles.shell} relative min-h-screen`}>
      <span className={styles.aura} aria-hidden />
      <span className={styles.auraLow} aria-hidden />

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
          <Link href="/search" className={styles.navItem}>
            <Search className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            <span className="hidden text-sm xl:inline">Justuju</span>
          </Link>

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

          <Link href="/reels" className={styles.navItem}>
            <Film className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            <span className="hidden text-sm xl:inline">Reels</span>
          </Link>

          <Link href="/chats" className={styles.navItem}>
            <MessageCircle className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            <span className="hidden text-sm xl:inline">Payomho</span>
          </Link>

          <Link href="/profile" className={styles.navItem}>
            <User className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            <span className="hidden text-sm xl:inline">Profil</span>
          </Link>
        </nav>

        <div className="mt-4 border-t border-[var(--line)] pt-4">
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
        </div>
      </aside>

      {/* ================= QATORI BOLO (telefon) ================= */}
      <header
        className={`${styles.topBar} sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden`}
      >
        <Link href="/profile" className="flex items-center gap-2">
          <span
            className={`${styles.gradBg} flex h-7 w-7 items-center justify-center rounded-[10px] text-xs font-black`}
          >
            T
          </span>
          <span className={`${styles.gradText} text-lg font-black tracking-tight`}>
            Profil
          </span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Naqlro ivaz kuned"
          className={styles.iconBtn}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" strokeWidth={1.8} />
          ) : (
            <Moon className="h-5 w-5" strokeWidth={1.8} />
          )}
        </button>
      </header>

      {/* ================= QISMI ASOSI ================= */}
      <main className="relative z-10 mx-auto w-full max-w-[935px] px-4 pb-20 md:pl-[100px] xl:pl-[280px]">
        {children}
      </main>
    </div>
  );
}
