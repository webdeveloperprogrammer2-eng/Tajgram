"use client";

// ============================================================
//  /profile/[userId] - profili korbari DIGAR.
//
//  Peshtar in jo DU so-rovi judo bud: yake profili on odam,
//  digare profili KHUDAM (faqat baroi fahmidani "in mananam?").
//  Vale profili khudam allakay dar <SessionProvider> hast -
//  ya'ne so-rovi dubora behuda merfat.
//
//  Boz du khato bud:
//    1) matnho ba zaboni RUSI budand ("Загружаем профиль...") -
//       dar tamomi sayti tojiki.
//    2) agar korbar ba profili KHUDASH medaromad, uro ba
//       /profile-i asosi namefiristod - du sahifai gunogun
//       baroi yak chiz kushoda meshud.
// ============================================================
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { ProfileView } from "@/components/ProfileView";
import { useSession } from "@/components/SessionProvider";
import { useT } from "@/components/LocaleProvider";
import { tr } from "@/components/appLang";

export default function UserProfilePage() {
  const { t } = useT();
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  // "Ki man hastam" - az session-i umumi, be so-rovi iловagi
  const { me } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isMe = me !== null && me.userId === userId;

  // Ba profili KHUDAM -> ba /profile mefiristem (tugmahoi
  // "Tahrir", "Posti nav" va tabi "Saqlshuda" faqat on jo hastand).
  useEffect(() => {
    if (isMe) router.replace("/profile");
  }, [isMe, router]);

  useEffect(() => {
    if (!userId || isMe) return;

    let alive = true;

    // queueMicrotask - to setState render-i joriro az nav nakashad
    queueMicrotask(() => {
      if (!alive) return;
      setLoading(true);
      setError("");
    });

    api
      .userProfile(userId)
      .then((response) => {
        if (!alive) return;

        if (response.data === null) setError(tr().userNotFound);
        else setProfile(response.data);
      })
      .catch((cause: unknown) => {
        if (!alive) return;
        setError(
          cause instanceof Error ? cause.message : tr().profileNotFound,
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [userId, isMe]);

  if (loading || isMe) return <ProfileSkeleton />;

  if (error !== "" || profile === null) {
    return (
      <div className="animate-fade-up flex flex-col items-center gap-3 py-24 text-center">
        <h1 className="text-[22px] font-bold">{t.pageUnavailable}</h1>
        <p className="text-[14px]" style={{ color: "var(--muted)" }}>
          {error !== "" ? error : t.userNotFound}
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-2 h-8 rounded-lg bg-[#0095f6] px-4 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#1877f2]"
        >
          {t.toFeed}
        </button>
      </div>
    );
  }

  return (
    <ProfileView profile={profile} myUserId={me?.userId ?? ""} />
  );
}

/** Chorchubahoi khoki - sokhtor AYNAN monandi profili tayyor. */
function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[935px] px-4 pt-4 md:px-5 md:pt-8">
      <div className="flex flex-col md:flex-row">
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

      <div className="mt-11 grid grid-cols-3 gap-[2px] md:gap-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton aspect-square rounded-none" />
        ))}
      </div>
    </div>
  );
}
