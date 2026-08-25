"use client";

// ============================================================
//  UserShell - ramkai umumi baroi /getInfoUsers.
//  Sidebar in jo NEST - u yak joi ast, dar components/AppFrame.tsx.
//  Naql (dark/light) az localStorage girifta meshavad.
// ============================================================
import { useEffect, useState } from "react";

import { onThemeChange, readTheme, type AppTheme } from "@/components/appTheme";
import styles from "../user.module.css";

export default function UserShell({
  children,
}: {
  children: React.ReactNode;
}) {
  // Naql az joi UMUMI meoyad - tugmai sidebar darhol in jo ham kor mekunad.
  const [theme, setTheme] = useState<AppTheme>("dark");

  useEffect(() => {
    queueMicrotask(() => setTheme(readTheme()));
    return onThemeChange(setTheme);
  }, []);

  return (
    <div data-theme={theme} className={`${styles.shell} relative min-h-screen`}>
      <span className={styles.aura} aria-hidden />
      <span className={styles.auraLow} aria-hidden />



      {/* ================= QISMI ASOSI ================= */}
      <main className="relative z-10 mx-auto w-full max-w-[935px] px-4 pt-[76px] pb-24 md:pb-16 md:pl-[265px] md:pr-6 md:pt-6">
        {children}
      </main>
    </div>
  );
}
