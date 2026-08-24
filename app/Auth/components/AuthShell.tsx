"use client";

// ============================================================
//  AuthShell - ramkai umumi.
//  Chap: swiper bo 10 surat (dar kartai gird).  Rost: forma.
//  Dizayn: ayni hamon sabki /profile - kunjhoi gird,
//  nurhoi narmi gradient, tugmahoi gird.
//  h-screen + overflow-hidden -> sahifa HECH GOH scroll namekunad.
// ============================================================
import { useEffect, useState } from "react";

import { checkHealth, type Health } from "../api";
import { AuthProvider, useSettings } from "../providers";
import { editorial } from "../fonts";
import styles from "../auth.module.css";

import PhotoSwiper from "./PhotoSwiper";
import Logo from "./Logo";
import RouteTabs from "./RouteTabs";
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

  // Holati VOQEI-i server az GET /health
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    checkHealth().then(setHealth);
  }, []);

  return (
    <div
      data-theme={theme}
      className={`${styles.shell} ${editorial.variable} relative flex h-screen w-full overflow-hidden`}
    >
      {/* Nurhoi narmi gradient dar fon */}
      <span className={styles.aura} aria-hidden />
      <span className={styles.auraLow} aria-hidden />

      {/* ================= CHAP: SWIPER ================= */}
      <div className="relative z-10 hidden p-4 lg:block lg:w-[52%] xl:w-[55%]">
        <div className="h-full overflow-hidden rounded-[32px] shadow-[var(--shadow)]">
          <PhotoSwiper />
        </div>
      </div>

      {/* ================= ROST: FORMA ================= */}
      <section className="relative z-10 flex h-full min-w-0 flex-1 flex-col">
        {/* ---- Satri bolo ---- */}
        <header className="flex shrink-0 items-center justify-between px-6 py-5 sm:px-10">
          {/* Dar telefon logo, dar kompyuter tabho */}
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="hidden lg:block">
            <RouteTabs />
          </div>

          <div className="flex items-center gap-1">
            <LangSwitch />
            <ThemeToggle />
          </div>
        </header>

        {/* Dar telefon tabho zeri logo meshavand */}
        <div className="shrink-0 px-6 pb-2 sm:px-10 lg:hidden">
          <RouteTabs />
        </div>

        {/* ---- Forma: dar markaz, dar kartai gird ---- */}
        <div className="flex min-h-0 flex-1 items-center overflow-y-auto px-5 py-4 sm:px-8 xl:px-12">
          <div
            className={`${styles.card} mx-auto w-full max-w-md px-6 py-9 sm:px-9 sm:py-11`}
          >
            {children}
          </div>
        </div>

        {/* ---- Poyon: holati server ---- */}
        <footer
          className="flex shrink-0 items-center justify-between px-6 py-4 text-[12px] sm:px-10"
          style={{ color: "var(--muted)" }}
        >
          <span className="font-medium">Tajgram</span>

          <span
            className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: "var(--panel)" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  health === null
                    ? "var(--muted)"
                    : health.ok
                      ? "var(--ok)"
                      : "var(--danger)",
              }}
            />
            {health === null
              ? t.statusChecking
              : health.ok
                ? `${t.statusOnline} ${health.ms}ms`
                : t.statusOffline}
          </span>
        </footer>
      </section>
    </div>
  );
}
