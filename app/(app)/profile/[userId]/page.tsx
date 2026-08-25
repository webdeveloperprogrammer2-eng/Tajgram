"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { ProfileView } from "@/components/ProfileView";

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kii MAN hastam? Bе in, dar profili KHUDAM tugmai "Follow"
  // menamud - va server khud-follow-ro qabul namekunad.
  useEffect(() => {
    let alive = true;

    api
      .myProfile()
      .then((response) => {
        if (alive) setMyId(response.data?.userId ?? null);
      })
      .catch(() => {
        if (alive) setMyId(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let alive = true;

    api
      .userProfile(userId)
      .then((response) => {
        if (alive) setProfile(response.data);
      })
      .catch((cause: unknown) => {
        if (alive) setError(cause instanceof Error ? cause.message : "Профиль не найден");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [userId]);

  if (loading) {
    return <p className="px-4 py-10 text-center text-[14px] text-[var(--muted)]">Загружаем профиль...</p>;
  }

  if (error || !profile) {
    return (
      <p className="px-4 py-10 text-center text-[14px] text-[var(--muted)]">
        {error ?? "Профиль не найден"}
      </p>
    );
  }

  return <ProfileView profile={profile} isMe={!!myId && myId === profile.userId} />;
}
