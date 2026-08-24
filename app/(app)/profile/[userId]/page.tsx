"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { ProfileView } from "@/components/ProfileView";
import { useT } from "@/components/LocaleProvider";

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useT();
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
        if (alive) setError(cause instanceof Error ? cause.message : t.profileNotFound);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [userId]);

  if (loading) {
    return <p className="px-4 py-10 text-center text-[14px] text-[var(--muted)]">{t.loading}</p>;
  }

  if (error || !profile) {
    return (
      <p className="px-4 py-10 text-center text-[14px] text-[var(--muted)]">
        {error ?? t.profileNotFound}
      </p>
    );
  }

  return <ProfileView profile={profile} />;
}
