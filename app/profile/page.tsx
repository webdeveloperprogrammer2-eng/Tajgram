"use client";

// ============================================================
//  app/profile/page.tsx   ->  adres: /profile
//
//  In sahifa 4 holat dorad:
//    loading -> hanuz az server meoyad
//    guest   -> token nest (boyad login kunad)
//    error   -> server khato dod
//    ready   -> hama chiz tayyor
//
//  Tartibi qismho (monandi instagram):
//    1. ProfileHeader - avatar, nom, hisobho
//    2. Highlights    - storyho
//    3. ContentTabs   - POSTHO / REELS / SAQLSHUDA
// ============================================================
import Link from "next/link";
import { LockKeyhole, TriangleAlert } from "lucide-react";

import { useProfile } from "./providers";
import styles from "./profile.module.css";

import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

import ContentTabs from "./components/ContentTabs";
import Highlights from "./components/Highlights";
import ProfileHeader from "./components/ProfileHeader";

export default function ProfilePage() {
  const { status, error, reload } = useProfile();

  // ---------- 1. Hanuz bor meshavad ----------
  if (status === "loading") {
    return <LoadingView />;
  }

  // ---------- 2. Token nest ----------
  if (status === "guest") {
    return (
      <div
        className={`${styles.card} ${styles.rise} mt-16 flex flex-col items-center gap-5 px-8 py-16 text-center`}
      >
        <span
          className={`${styles.gradBg} flex h-14 w-14 items-center justify-center rounded-2xl`}
        >
          <LockKeyhole className="h-6 w-6" strokeWidth={1.8} />
        </span>

        <h1 className="text-2xl font-bold tracking-tight">Avval daroed</h1>

        <p
          className="max-w-sm text-sm leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          Baroi didani profil boyad ba account daroed. Ma&apos;lumoti profil
          (nom, email, postho) az server megirad.
        </p>

        <Button asChild>
          <Link href="/Auth/login">Ba login raftan</Link>
        </Button>
      </div>
    );
  }

  // ---------- 3. Khatoi server ----------
  if (status === "error") {
    return (
      <div
        className={`${styles.card} ${styles.rise} mt-16 flex flex-col items-center gap-5 px-8 py-16 text-center`}
      >
        <Alert variant="destructive" className={`${styles.snap} max-w-md`}>
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
          <span>{error}</span>
        </Alert>

        <Button variant="soft" onClick={() => reload()}>
          Boz yak bor sanjed
        </Button>
      </div>
    );
  }

  // ---------- 4. Hama chiz tayyor ----------
  return (
    <>
      <ProfileHeader />
      <Highlights />
      <ContentTabs />
    </>
  );
}

// ------------------------------------------------------------
//  Vaqte ma'lumot hanuz nayomadaast - chorchubahoi khoki.
// ------------------------------------------------------------
function LoadingView() {
  return (
    <div className="pt-8 sm:pt-12">
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-14">
        <Skeleton className="h-32 w-32 shrink-0 rounded-full sm:h-[168px] sm:w-[168px]" />

        <div className="w-full flex-1 space-y-5">
          <Skeleton className="h-8 w-48 rounded-full" />
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="h-4 w-64 rounded-full" />
        </div>
      </div>

      <div className="mt-12 flex gap-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[72px] w-[72px] shrink-0 rounded-full" />
        ))}
      </div>

      <div className="mt-12 grid grid-cols-3 gap-2 sm:gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    </div>
  );
}
