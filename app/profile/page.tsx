"use client";

// ============================================================
//  app/profile/page.tsx   ->  adres: /profile
//
//  In sahifa 3 holat dorad:
//    loading -> hanuz az server meoyad
//    error   -> server khato dod
//    ready   -> hama chiz tayyor
//
//  Holati "guest" DIGAR IN JO NEST: korbari nadaromadaro
//  components/AppFrame.tsx allakay ba /Auth/login mefiristad,
//  ya'ne to in jo faqat odami DAROMADA merasad.
//
//  Tartibi qismho (monandi instagram):
//    1. ProfileHeader - avatar, nom, tugmaho, raqamho
//    2. Highlights    - ACTUALNIY (/Actual/*)
//    3. ContentTabs   - POSTHO / REELS / SAQLSHUDA
//
//  DIQQAT dar borai qatori doirahoi zeri profil:
//  on joi "ACTUALNIY" ast - ya'ne to-plamhoi HAMESHAGI
//  (/Actual/*), NA storyhoi 24-soata. Peshtar hamon storyhoi
//  24-soata du bor namoyon meshudand: yak bor dar avatar, yak
//  bor dar hamon qator. Hozir:
//    storyhoi 24-soata -> faqat az AVATAR
//    actualniy         -> hamin qator (backend 26.08.2026 dod)
// ============================================================
import { TriangleAlert } from "lucide-react";

import { useProfile } from "./providers";

import ContentTabs from "./components/ContentTabs";
import Highlights from "./components/Highlights";
import ProfileHeader from "./components/ProfileHeader";
import { useT } from "@/components/LocaleProvider";

export default function ProfilePage() {
  const { t } = useT();
  const { status, error, reload } = useProfile();

  // ---------- 1. Hanuz bor meshavad ----------
  if (status === "loading") return <LoadingView />;

  // ---------- 2. Khatoi server ----------
  if (status === "error" || status === "guest") {
    return (
      <div className="animate-fade-up flex flex-col items-center gap-4 py-24 text-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full border-2"
          style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
        >
          <TriangleAlert className="h-6 w-6" strokeWidth={1.8} />
        </span>

        <h1 className="text-[22px] font-bold">{t.profileLoadFailed}</h1>

        <p
          className="max-w-[340px] text-[14px]"
          style={{ color: "var(--muted)" }}
        >
          {error !== "" ? error : "Server javob nadod."}
        </p>

        <button
          type="button"
          onClick={() => void reload()}
          className="mt-1 h-8 rounded-lg bg-[#0095f6] px-4 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#1877f2] active:scale-[0.97]"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  // ---------- 3. Hama chiz tayyor ----------
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
//  Sokhtori onho AYNAN monandi sahifai tayyor ast, to hangomi
//  omadani ma'lumot chizhо az joyash "naparand".
// ------------------------------------------------------------
function LoadingView() {
  return (
    <div className="pt-4 md:pt-8">
      <div className="flex flex-col md:flex-row">
        {/* Avatar */}
        <div className="flex shrink-0 items-start md:w-[290px] md:justify-center">
          <div className="skeleton mr-7 h-[77px] w-[77px] rounded-full md:mr-0 md:h-[150px] md:w-[150px]" />

          <div className="flex flex-1 items-center justify-around md:hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1.5 px-2">
                <div className="skeleton mx-auto h-4 w-8 rounded" />
                <div className="skeleton h-3 w-14 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Nom, raqamho, bio */}
        <div className="flex-1 pt-4 md:pt-0">
          <div className="skeleton h-6 w-40 rounded" />
          <div className="mt-5 hidden gap-10 md:flex">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-4 w-24 rounded" />
            ))}
          </div>
          <div className="mt-5 space-y-2">
            <div className="skeleton h-3.5 w-36 rounded" />
            <div className="skeleton h-3.5 w-56 rounded" />
          </div>
        </div>
      </div>

      {/* Turi postho */}
      <div className="mt-11 grid grid-cols-3 gap-[2px] md:gap-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton aspect-square rounded-none" />
        ))}
      </div>
    </div>
  );
}
