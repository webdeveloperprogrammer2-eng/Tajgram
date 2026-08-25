"use client";

// ============================================================
//  SearchShell - ramkai umumi baroi /search.
//  Sidebar in jo NEST: yak sidebar-i umumi
//  (components/Sidebar.tsx) az app/search/layout.tsx meoyad.
//  In jo faqat foni gradienti va joygirii matn.
//  Naql (dark/light) az <html data-theme> meoyad - ThemeSync.
// ============================================================
import styles from "../search.module.css";

export default function SearchShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.shell} relative min-h-screen`}>
      <span className={styles.aura} aria-hidden />
      <span className={styles.auraLow} aria-hidden />

      {/* ================= QISMI ASOSI ================= */}
      <main className="relative z-10 mx-auto w-full max-w-[720px] px-4 pt-[60px] pb-28 md:pl-[265px] md:pr-6 md:pt-6 md:pb-16">
        {children}
      </main>
    </div>
  );
}
