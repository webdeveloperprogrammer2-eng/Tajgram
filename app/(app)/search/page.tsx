"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ProfileUser } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { SearchIcon } from "@/components/icons";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<ProfileUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Небольшая задержка, чтобы не дёргать бэкенд на каждое нажатие.
  useEffect(() => {
    let alive = true;

    const timer = setTimeout(() => {
      api
        .searchUsers(query.trim() || undefined, { page: 1, pageSize: 20 })
        .then((response) => {
          if (alive) setPeople(response.data ?? []);
        })
        .catch(() => {
          if (alive) setPeople([]);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, 300);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-[600px] px-4 py-6">
      <h1 className="animate-fade-up mb-4 text-[22px] font-bold">Search</h1>

      <div className="animate-fade-up mb-5 flex items-center gap-2 rounded-xl bg-[#f1f1f1] px-3 py-2.5 text-[#8e8e8e] transition-all duration-300 focus-within:bg-white focus-within:shadow-[0_0_0_2px_rgba(0,149,246,0.25)]">
        <SearchIcon size={16} />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setLoading(true);
          }}
          placeholder="Search people"
          className="w-full bg-transparent text-[14px] text-[#262626] outline-none placeholder:text-[#8e8e8e]"
        />
      </div>

      <ul className="space-y-3">
        {loading &&
          Array.from({ length: 6 }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 p-2">
              <div className="skeleton h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-28 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </li>
          ))}

        {!loading &&
          people.map((person, index) => (
            <li
              key={person.userId}
              style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
              className="animate-fade-up flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[#fafafa]"
            >
              <Link href={`/profile/${person.userId}`}>
                <Avatar src={person.image} name={person.fullName} size={44} />
              </Link>
              <div className="min-w-0 flex-1 leading-tight">
                <Link
                  href={`/profile/${person.userId}`}
                  className="block truncate text-[14px] font-semibold transition-colors hover:text-[#0095f6]"
                >
                  {person.userName}
                </Link>
                <span className="block truncate text-[14px] text-[#8e8e8e]">
                  {person.fullName}
                  {person.isFollower ? " · Follows you" : ""}
                </span>
              </div>
              <FollowButton
                userId={person.userId}
                initialFollowing={person.isFollowing}
                variant="solid"
              />
            </li>
          ))}

        {!loading && people.length === 0 && (
          <li className="py-10 text-center text-[14px] text-[#8e8e8e]">
            Никого не нашли.
          </li>
        )}
      </ul>
    </div>
  );
}
