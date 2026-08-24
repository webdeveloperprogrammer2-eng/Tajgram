"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ProfileUser } from "@/lib/types";
import { Avatar } from "./Avatar";
import { FollowButton } from "./FollowButton";
import { useSession } from "./SessionProvider";
import { useT } from "./LocaleProvider";

/** Правая колонка: текущий пользователь и рекомендации. */
export function RightRail() {
  const { me } = useSession();
  const { t } = useT();
  const [people, setPeople] = useState<ProfileUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .searchUsers(undefined, { page: 1, pageSize: 5 })
      .then((response) => {
        if (alive) setPeople(response.data ?? []);
      })
      .catch(() => {
        if (alive) setPeople([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <aside className="hidden w-[320px] shrink-0 pl-16 pt-9 xl:block">
      {me && (
        <div className="animate-fade-up mb-6 flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-[var(--hover)]">
          <Link href="/profile">
            <Avatar src={me.image} name={me.fullName ?? me.userName} size={44} />
          </Link>
          <div className="min-w-0 flex-1 leading-tight">
            <Link
              href="/profile"
              className="block truncate text-[14px] font-semibold transition-colors hover:text-[var(--sb-accent)]"
            >
              {me.userName}
            </Link>
            <span className="block truncate text-[14px] text-[var(--muted)]">
              {me.fullName}
            </span>
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between px-2">
        <span className="text-[14px] font-semibold text-[var(--muted)]">
          {t.suggestedForYou}
        </span>
        <Link
          href="/search"
          className="text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--sb-accent)]"
        >
          {t.seeAll}
        </Link>
      </div>

      <ul className="space-y-1">
        {loading &&
          Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 p-2">
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-2.5 w-24 rounded" />
                <div className="skeleton h-2.5 w-16 rounded" />
              </div>
            </li>
          ))}

        {people.map((person, index) => (
          <li
            key={person.userId}
            style={{ animationDelay: `${index * 70}ms` }}
            className="animate-fade-up flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--hover)]"
          >
            <Link href={`/profile/${person.userId}`}>
              <Avatar
                src={person.image}
                name={person.fullName ?? person.userName}
                size={32}
              />
            </Link>
            <div className="min-w-0 flex-1 leading-tight">
              <Link
                href={`/profile/${person.userId}`}
                className="block truncate text-[12px] font-semibold transition-colors hover:text-[var(--sb-accent)]"
              >
                {person.userName}
              </Link>
              <span className="block truncate text-[12px] text-[var(--muted)]">
                {person.isFriend
                  ? t.friends
                  : person.isFollower
                    ? t.followsYou
                    : t.suggestedForYou}
              </span>
            </div>
            <FollowButton userId={person.userId} initialFollowing={person.isFollowing} />
          </li>
        ))}

        {!loading && people.length === 0 && (
          <li className="px-2 text-[13px] text-[var(--muted)]">{t.noSuggestions}</li>
        )}
      </ul>

      <footer className="mt-8 space-y-3 px-2 text-[11px] uppercase text-[var(--muted)]">
        <p className="flex flex-wrap gap-x-2 gap-y-1">
          {["About", "Help", "Press", "API", "Jobs", "Privacy", "Terms"].map((item) => (
            <span key={item} className="transition-colors hover:text-[var(--muted)]">
              {item}
            </span>
          ))}
        </p>
        <p>&copy; {new Date().getFullYear()} Tajgram</p>
      </footer>
    </aside>
  );
}
