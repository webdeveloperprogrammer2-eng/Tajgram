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
      className={`${styles.shell} relative flex min-h-screen w-full flex-col justify-between p-4 sm:p-6 lg:p-10`}
    >
      {/* ================= SATRI BOLO: TOGGLE-HO ================= */}
      <header className="relative z-20 flex items-center justify-between">
        <Link
          href="/Auth/login"
          className="flex items-center gap-2.5 rounded-full bg-black/60 px-4 py-2 text-white backdrop-blur-md transition-transform hover:scale-105"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
          <span className="font-serif text-base font-bold tracking-tight">
            Tajgram
          </span>
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 p-1.5 backdrop-blur-md">
          <LangSwitch />
          <ThemeToggle />
        </div>
      </header>

      {/* ================= MARKAZI ASOSI: GRID ================= */}
      <main className="relative z-10 my-auto grid w-full flex-1 items-center gap-8 py-6 lg:grid-cols-12">
        {/* --- CHAP POYON: KORTAI SHISHAGII BANNER --- */}
        <div className="hidden lg:col-span-6 lg:flex lg:flex-col lg:justify-end lg:pr-8">
          <div className={`${styles.leftCard} max-w-lg p-8 sm:p-10 shadow-2xl`}>
            <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Ҳар лаҳза — <br />
              як ҳикояи нотакрор аст.
            </h1>
            <p className="mt-4 text-sm font-normal leading-relaxed text-white/80">
              Лаҳзаҳои беҳтарини худро дар Tajgram бо дӯстон ва олам мубодила кунед!
            </p>

            {/* Дотс ва пагинатсия (мисли акси корбар) */}
            <div className="mt-8 flex items-center gap-2.5">
              <span className="h-2.5 w-12 rounded-full bg-white shadow-sm" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/50" />
            </div>
          </div>
        </div>

        {/* --- ROST: KORTAI SHISHAGII FORMA (EXACT DESIGN FROM PHOTO) --- */}
        <div className="flex w-full justify-center lg:col-span-6 lg:justify-end">
          <div className={`${styles.glassCard} relative w-full max-w-md p-7 sm:p-10`}>
            {/* Top Badge (Instagram pill icon + text logo) */}
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-white shadow-xl">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span className="font-serif text-sm font-semibold tracking-wide">
                  Tajgram
                </span>
              </div>
            </div>

            {children}
          </div>
        </div>
      </main>

      {/* ================= POYONI SAYT: STATUSI SERVER ================= */}
      <footer className="relative z-20 flex items-center justify-between text-[12px] font-medium text-white/80">
        <span>© 2026 Tajgram</span>

        <span className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 backdrop-blur-md">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background:
                health === null
                  ? "rgba(255,255,255,0.6)"
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
