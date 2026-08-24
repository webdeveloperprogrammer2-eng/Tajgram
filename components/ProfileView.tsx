"use client";

import Link from "next/link";
import { formatCount } from "@/lib/format";
import type { UserProfile } from "@/lib/types";
import { Avatar } from "./Avatar";
import { FollowButton } from "./FollowButton";
import { PostGrid } from "./PostGrid";
import { useT } from "./LocaleProvider";
import { ImageIcon } from "./icons";

export function ProfileView({
  profile,
  isMe = false,
}: {
  profile: UserProfile;
  isMe?: boolean;
}) {
  const { t } = useT();
  const posts = profile.posts ?? [];

  return (
    <div className="mx-auto w-full max-w-[935px] px-4 py-6">
      <header className="animate-fade-up flex flex-col gap-6 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-start sm:gap-12">
        <div className="flex justify-center sm:justify-start">
          <Avatar
            src={profile.image}
            name={profile.fullName ?? profile.userName}
            size={150}
            ring="gradient"
            className="hidden sm:inline-flex"
          />
          <Avatar
            src={profile.image}
            name={profile.fullName ?? profile.userName}
            size={90}
            ring="gradient"
            className="sm:hidden"
          />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[20px]">{profile.userName}</h1>
            {isMe ? (
              <Link
                href="/settings"
                className="rounded-lg bg-[var(--hover)] px-4 py-1.5 text-[14px] font-semibold transition-all duration-200 hover:bg-[var(--border)] active:scale-95"
              >
                {t.editProfile}
              </Link>
            ) : (
              <FollowButton
                userId={profile.userId}
                initialFollowing={profile.isFollowing}
                variant="solid"
              />
            )}
          </div>

          <ul className="mt-5 flex gap-8 text-[15px]">
            {[
              { value: profile.postCount, label: t.posts },
              { value: profile.subscribersCount, label: t.followers },
              { value: profile.subscriptionsCount, label: t.followingCount },
            ].map((stat, index) => (
              <li
                key={stat.label}
                style={{ animationDelay: `${index * 80}ms` }}
                className="animate-fade-up cursor-default transition-transform duration-200 hover:-translate-y-0.5"
              >
                <b>{formatCount(stat.value)}</b> {stat.label}
              </li>
            ))}
          </ul>

          <div className="mt-5 text-[14px] leading-[18px]">
            <div className="font-semibold">{profile.fullName}</div>
            {profile.about && <p className="whitespace-pre-line">{profile.about}</p>}
          </div>
        </div>
      </header>

      <div className="mt-1 py-4">
        {posts.length > 0 ? (
          <PostGrid posts={posts} />
        ) : (
          <div className="animate-fade-up flex flex-col items-center gap-3 py-16 text-center text-[var(--muted)]">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#fdf2f8,#eef2ff)] text-[#c084fc]">
              <ImageIcon size={40} />
            </span>
            <p className="text-[14px]">{t.noUserPosts}</p>
          </div>
        )}
      </div>
    </div>
  );
}
