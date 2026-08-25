"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { shortTimeAgo } from "@/lib/format";
import type { Chat } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { MessageIcon } from "@/components/icons";

export default function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .chats()
      .then((response) => {
        if (alive) setChats(response.data ?? []);
      })
      .catch(() => {
        if (alive) setChats([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[600px] px-4 py-6">
      <h1 className="animate-fade-up mb-5 text-[22px] font-bold">Messages</h1>

      {loading && (
        <ul className="space-y-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 p-2">
              <div className="skeleton h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-32 rounded" />
                <div className="skeleton h-3 w-48 rounded" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && chats.length === 0 && (
        <div className="animate-fade-up flex flex-col items-center gap-3 py-16 text-center text-[var(--muted)]">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#eef2ff,#fdf2f8)] text-[#818cf8]">
            <MessageIcon size={40} />
          </span>
          <p className="text-[14px]">Пока нет ни одного чата.</p>
        </div>
      )}

      <ul className="space-y-1">
        {chats.map((chat, index) => (
          <li
            key={chat.chatId}
            style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
            className="animate-fade-up flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--panelSoft)]"
          >
            <Avatar src={chat.userImage} name={chat.fullName} size={56} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[14px] font-semibold">{chat.userName}</div>
              <div className="truncate text-[14px] text-[var(--muted)]">
                {chat.lastMessage ?? "Нет сообщений"}
              </div>
            </div>
            <span className="shrink-0 text-[12px] text-[var(--muted)]">
              {shortTimeAgo(chat.lastMessageDate ?? chat.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
