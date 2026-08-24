"use client";

// ============================================================
//  ReelsShell - ramkai umumi baroi /reels.
//  Ayni hamon dizayni /profile va /chats:
//  sidebar-i chap (kompyuter) + qatori boloi shishagi (telefon).
// ============================================================
import { useEffect } from "react";

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


function Frame({ children }: { children: React.ReactNode }) {
  const { theme } = useReels();

  useEffect(() => {
    document.documentElement.setAttribute("data-reels-theme", theme);
    return () => {
      document.documentElement.removeAttribute("data-reels-theme");
    };
  }, [theme]);

  return (
    <div data-theme={theme} className={`${styles.shell} relative h-screen`}>
      <span className={styles.aura} aria-hidden />



      {/* ================= QISMI ASOSI ================= */}
      <main className="relative z-10 h-full pt-[60px] pb-[50px] md:pb-0 md:pl-[245px] md:pt-0">
        {children}
      </main>
    </div>
  );
}
