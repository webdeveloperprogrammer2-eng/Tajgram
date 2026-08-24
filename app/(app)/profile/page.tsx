"use client";

import { ProfileView } from "@/components/ProfileView";
import { useSession } from "@/components/SessionProvider";

export default function MyProfilePage() {
  const { me, loading } = useSession();

  if (loading) {
    return <p className="px-4 py-10 text-center text-[14px] text-[#8e8e8e]">Загружаем профиль...</p>;
  }

  if (!me) {
    return (
      <p className="px-4 py-10 text-center text-[14px] text-[#8e8e8e]">
        Профиль недоступен: бэкенд не ответил.
      </p>
    );
  }

  return <ProfileView profile={me} isMe />;
}
