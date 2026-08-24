"use client";

// ============================================================
//  ProfileShell - "ramkai" umumi baroi sahifai profil.
//  Dizayn: monandi instagram -
//    - SIDEBAR-i chap (kompyuter)
//    - qatori poyoni (telefon)
//    - qatori boloi bo logo (telefon)
//  Logika ivaz nashudaast: faqat naql (theme) va baromadan.
// ============================================================
import { useEffect } from "react";
import Link from "next/link";
import {
  Bookmark,
  Compass,
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
  Film,
} from "lucide-react";

import { ProfileProvider, useProfile } from "../providers";
import styles from "../profile.module.css";

export default function ProfileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  // Avval Provider, ba'd Frame - chunki Frame az Provider ma'lumot megirad
  return (
    <ProfileProvider>
      <Frame>{children}</Frame>
    </ProfileProvider>
  );
}

// Ro-ykhati navigatsiya. "soon" = hanuz sahifaash nest.
const NAV = [
  { key: "home", label: "Asosi", icon: Home, soon: true },
  { key: "search", label: "Justuju", icon: Search, soon: true },
  { key: "explore", label: "Kashf", icon: Compass, soon: true },
  { key: "likes", label: "Bayanho", icon: Heart, soon: true },
  { key: "create", label: "Guzoshtan", icon: PlusSquare, soon: true },
  { key: "saved", label: "Saqlshuda", icon: Bookmark, soon: true },
];

function Frame({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme, status, logout, profile } = useProfile();

  // Radix modal-horo ba <body> mekashad - berun az .shell.
  // Baroi hamin rangho boyad dar <html> ham bosand.
  useEffect(() => {
    document.documentElement.setAttribute("data-profile-theme", theme);
    return () => {
      document.documentElement.removeAttribute("data-profile-theme");
    };
  }, [theme]);

  return (
    <div
      data-theme={theme}
      className={`${styles.shell} relative min-h-screen`}
    >
      {/* Nurhoi narmi gradient dar fon */}
      <span className={styles.aura} aria-hidden />
      <span className={styles.auraLow} aria-hidden />

      {/* ================= SIDEBAR (kompyuter) ================= */}
      <aside
        className={`${styles.sidebar} fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col px-3 py-6 md:flex xl:w-[248px] xl:px-4`}
      >
        {/* --- Logo --- */}
        <Link
          href="/profile"
          className="mb-8 flex items-center gap-3 px-2 xl:px-3"
        >
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

        {/* --- Nav --- */}
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <SideItem key={item.key} label={item.label} icon={item.icon} />
          ))}

          {/* REELS - sahifai haqiqi (/reels) */}
          <Link href="/reels" className={styles.navItem}>
            <Film className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            <span className="hidden text-sm xl:inline">Reels</span>
          </Link>

          {/* PAYOMHO - sahifai haqiqi (/chats) */}
          <Link href="/chats" className={styles.navItem}>
            <MessageCircle className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            <span className="hidden text-sm xl:inline">Payomho</span>
          </Link>

          {/* Profil - sahifai hozira */}
          <Link href="/profile" className={`${styles.navItem} ${styles.navItemActive}`}>
            <User className="h-6 w-6 shrink-0" strokeWidth={2} />
            <span className="hidden text-sm xl:inline">Profil</span>
          </Link>
        </nav>

        {/* --- Poyoni sidebar --- */}
        <div className="mt-4 flex flex-col gap-1 border-t border-[var(--line)] pt-4">
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
        className={`${styles.topBar} sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden`}
      >
        <Link href="/profile" className="flex items-center gap-2">
          <span
            className={`${styles.gradBg} flex h-7 w-7 items-center justify-center rounded-[10px] text-xs font-black`}
          >
            T
          </span>
          <span className={`${styles.gradText} text-lg font-black tracking-tight`}>
            Tajgram
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <IconBtn onClick={toggleTheme} label="Naqlro ivaz kuned">
            {theme === "dark" ? (
              <Sun className="h-5 w-5" strokeWidth={1.8} />
            ) : (
              <Moon className="h-5 w-5" strokeWidth={1.8} />
            )}
          </IconBtn>

          {status === "ready" && (
            <IconBtn onClick={logout} label="Baromadan">
              <LogOut className="h-5 w-5" strokeWidth={1.8} />
            </IconBtn>
          )}
        </div>
      </header>

      {/* ================= QISMI ASOSI ================= */}
      <main className="relative z-10 mx-auto w-full max-w-[935px] px-4 pb-28 md:pl-[100px] md:pr-6 md:pb-16 xl:pl-[280px]">
        {children}
      </main>

      {/* ================= QATORI POYON (telefon) ================= */}
      <nav
        className={`${styles.bottomBar} fixed inset-x-0 bottom-0 z-40 flex items-center justify-around px-2 py-2.5 md:hidden`}
      >
        {[Home, Search, PlusSquare].map((Icon, i) => (
          <span key={i} className="p-2 opacity-40">
            <Icon className="h-6 w-6" strokeWidth={1.8} />
          </span>
        ))}

        <Link href="/chats" aria-label="Payomho" className="p-2">
          <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
        </Link>

        <Link href="/profile" className="p-1.5">
          <span
            className={`${styles.gradBg} flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black`}
          >
            {(profile?.userName ?? "T").slice(0, 1).toUpperCase()}
          </span>
        </Link>
      </nav>
    </div>
  );
}

// Nuqtai nav dar sidebar - hanuz sahifaash nest
function SideItem({
  label,
  icon: Icon,
}: {
  label: string;
  icon: typeof Home;
}) {
  return (
    <span
      className={`${styles.navItem} ${styles.navItemSoon}`}
      title="Ba zudi"
    >
      <Icon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
      <span className="hidden text-sm xl:inline">{label}</span>
    </span>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--fg)] transition-colors duration-150 hover:bg-[var(--panel)]"
    >
      {children}
    </button>
  );
}
