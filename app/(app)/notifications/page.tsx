"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, mediaUrl } from "@/lib/api";
import { shortTimeAgo } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { useSession } from "@/components/SessionProvider";
import { HeartIcon } from "@/components/icons";

export default function NotificationsPage() {
  const { refresh } = useSession();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const response = await api.notifications({ page: 1, pageSize: 30 });
        if (!alive) return;
        setItems(response.data ?? []);
        // Открыли экран — снимаем непрочитанные.
        await api.readAllNotifications().catch(() => {});
        await refresh();
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, [refresh]);

  return (
    <div className="mx-auto w-full max-w-[600px] px-4 py-6">
      <h1 className="animate-fade-up mb-5 text-[22px] font-bold">Notifications</h1>

      {loading && (
        <ul className="space-y-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 p-2">
              <div className="skeleton h-11 w-11 rounded-full" />
              <div className="skeleton h-3 w-56 rounded" />
            </li>
          ))}
        </ul>
      )}

      {!loading && items.length === 0 && (
        <div className="animate-fade-up flex flex-col items-center gap-3 py-16 text-center text-[var(--muted)]">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#fff1f2,#fdf4ff)] text-[#fb7185]">
            <HeartIcon size={40} />
          </span>
          <p className="text-[14px]">Активности пока нет.</p>
        </div>
      )}

      <ul className="space-y-1">
        {items.map((item, index) => {
          const preview = mediaUrl(item.previewImage);
          return (
            <li
              key={item.id}
              style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
              className={`animate-fade-up flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-[var(--panelSoft)] ${
                item.isRead ? "" : "bg-[#f2f8ff]"
              }`}
            >
              <Link href={`/profile/${item.userId}`}>
                <Avatar src={item.userImage} name={item.fullName} size={44} />
              </Link>

              <p className="min-w-0 flex-1 text-[14px] leading-[18px]">
                <Link href={`/profile/${item.userId}`} className="font-semibold">
                  {item.userName}
                </Link>{" "}
                {item.text}
                {item.preview ? ` «${item.preview}»` : ""}{" "}
                <span className="text-[var(--muted)]">{shortTimeAgo(item.createdAt)}</span>
              </p>

              {item.type === "subscribed" ? (
                <FollowButton
                  userId={item.userId}
                  initialFollowing={item.isFollowing}
                  variant="solid"
                />
              ) : (
                preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-lg object-cover transition-transform duration-300 hover:scale-105"
                  />
                )
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
