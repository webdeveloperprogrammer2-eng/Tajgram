"use client";

// ============================================================
//  ProfileShell - "ramkai" umumi baroi sahifai profil.
//  Dizayn: monandi instagram -
//    - SIDEBAR-i chap (kompyuter)
//    - qatori poyoni (telefon)
//    - qatori boloi bo logo (telefon)
//  Logika ivaz nashudaast: faqat naql (theme) va baromadan.
// ============================================================

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


function Frame({ children }: { children: React.ReactNode }) {
  const { theme } = useProfile();

  // Radix modal-horo ba <body> mekashad - berun az .shell.

  return (
    <div
      data-theme={theme}
      className={`${styles.shell} relative min-h-screen`}
    >
      {/* Nurhoi narmi gradient dar fon */}
      <span className={styles.aura} aria-hidden />
      <span className={styles.auraLow} aria-hidden />



      {/* ================= QISMI ASOSI ================= */}
      <main className="relative z-10 mx-auto w-full max-w-[935px] px-4 pt-[60px] pb-28 md:pl-[265px] md:pr-6 md:pt-6 md:pb-16">
        {children}
      </main>

    </div>
  );
}


