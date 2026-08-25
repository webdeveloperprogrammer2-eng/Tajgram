"use client";

// ============================================================
//  AuthShell - Disayni navi frosted glass (misli rasmi user).
//  Фони пурра бо сурати сифати баланд + ду корти шишагӣ.
// ============================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import { checkHealth, type Health } from "../api";
import { AuthProvider, useSettings } from "../providers";
import styles from "../auth.module.css";

import ThemeToggle from "./ThemeToggle";
import LangSwitch from "./LangSwitch";
import PhotoSwiper from "./PhotoSwiper";
import Logo from "./Logo";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Frame>{children}</Frame>
    </AuthProvider>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const { theme, t } = useSettings();
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    checkHealth().then(setHealth);
  }, []);

  return (
    <div
      data-theme={theme}
      className={`${styles.shell} relative flex min-h-screen w-full flex-col justify-between p-4 sm:p-6 lg:p-8`}
    >
      {/* ================= SATRI BOLO: TOGGLE-HO ================= */}
      <header className="relative z-20 flex items-center justify-between">
        <Link
          href="/Auth/login"
          className="flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-[var(--fg)] hover:bg-[var(--panelSoft)] hover:border-[var(--lineStrong)] transition-all duration-200 active:scale-[0.98] shadow-sm"
        >
          <svg
            className="h-4.5 w-4.5 text-[var(--brand)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
          <span className="font-sans text-sm font-bold tracking-tight">
            Tajgram
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LangSwitch />
          <ThemeToggle />
        </div>
      </header>

      {/* ================= MARKAZI ASOSI: GRID ================= */}
      <main className="relative z-10 my-auto grid w-full flex-1 items-center gap-8 py-6 lg:grid-cols-12 max-w-7xl mx-auto">
        {/* --- CHAP: BANNER CAROUSEL --- */}
        <div className="hidden lg:col-span-6 lg:block">
          <PhotoSwiper />
        </div>

        {/* --- ROST: KORTAI SHISHAGII FORMA --- */}
        <div className="flex w-full justify-center lg:col-span-6 lg:justify-end">
          <div className={`${styles.glassCard} relative w-full max-w-md p-6 sm:p-8 md:p-10`}>
            {/* Top Badge (Branded Camera Logo) */}
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-[var(--fg)] shadow-sm">
                <Logo size="small" />
              </div>
            </div>

            {children}
          </div>
        </div>
      </main>

      {/* ================= POYONI SAYT: STATUSI SERVER ================= */}
      <footer className="relative z-20 flex items-center justify-between text-[11px] font-bold tracking-wide" style={{ color: "var(--muted)" }}>
        <span>© 2026 Tajgram</span>

        <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3.5 py-2 text-[var(--fg)] shadow-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background:
                health === null
                  ? "rgba(156,163,175,0.6)"
                  : health.ok
                    ? "#10b981"
                    : "#ef4444",
            }}
          />
          {health === null
            ? t.statusChecking
            : health.ok
              ? `${t.statusOnline} ${health.ms}ms`
              : t.statusOffline}
        </span>
      </footer>
    </div>
  );
}
