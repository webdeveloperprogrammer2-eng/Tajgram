"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { ProfileView } from "@/components/ProfileView";

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return <p className="px-4 py-10 text-center text-[14px] text-[#8e8e8e]">Загружаем профиль...</p>;
  }

  if (error || !profile) {
    return (
      <p className="px-4 py-10 text-center text-[14px] text-[#8e8e8e]">
        {error ?? "Профиль не найден"}
      </p>
    );
  }

  return <ProfileView profile={profile} />;
}
