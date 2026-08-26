"use client";

// ============================================================
//  ChatList - sutuni chap: ro-ykhati suhbatho.
//    - justuju (dar hamin ro-ykhat, be so-rovi zieda)
//    - tugmai "suhbati nav" -> NewChatModal
//    - agar hamsuhbat ba man podpiska nadosad va man ham ba u -
//      dar satr qufl namoyon meshavad (navishtan mumkin nest)
// ============================================================
import { useState } from "react";
import { Lock, PenSquare, Search } from "lucide-react";

import { type Chat } from "../api";
import { chatTime } from "../format";
import { useChats } from "../providers";
import styles from "../chats.module.css";
import { useBlockedIds } from "@/lib/blocks";

import { useT } from "@/components/LocaleProvider";

import Avatar from "./Avatar";

export default function ChatList({
  activeId,
  onSelect,
  onNewChat,
}: {
  activeId: number | null;
  onSelect: (chat: Chat) => void;
  onNewChat: () => void;
}) {
  const { chats, allowedIds, me } = useChats();
  // Suhbati kasone ki MAN bastaam - dar ro-ykhati man nest.
  const blockedIds = useBlockedIds();
  const { t } = useT();
  const [query, setQuery] = useState("");

  const text = query.trim().toLowerCase();
  const visible = chats.filter((chat) => !blockedIds.has(chat.userId));
  const list =
    text === ""
      ? visible
      : visible.filter(
          (chat) =>
            chat.userName.toLowerCase().includes(text) ||
            (chat.fullName ?? "").toLowerCase().includes(text)
        );

  return (
    <div className="flex h-full flex-col">
      {/* ---------- Sarlavha ---------- */}
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <h1 className="text-xl font-bold tracking-tight">
          {me?.userName ?? t.navMessages}
        </h1>

        <button
          type="button"
          onClick={onNewChat}
          aria-label={t.newChat}
          className={styles.iconBtn}
        >
          <PenSquare className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>

      {/* ---------- Justuju ---------- */}
      <div className="px-5 pb-3">
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2.5"
          style={{ background: "var(--panel)" }}
        >
          <Search className="h-4 w-4 shrink-0" strokeWidth={1.8} style={{ color: "var(--muted)" }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: "var(--fg)" }}
          />
        </div>
      </div>

      {/* ---------- Ro-ykhat ---------- */}
      <div className={`${styles.scroll} flex-1 px-2 pb-4`}>
        {list.length === 0 ? (
          <p
            className="px-4 py-16 text-center text-[13px] leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            {visible.length === 0
              ? t.noChatsYet
              : t.nothingFound}
          </p>
        ) : (
          list.map((chat) => {
            const locked = !allowedIds.has(chat.userId);

            return (
              <button
                key={chat.chatId}
                type="button"
                onClick={() => onSelect(chat)}
                className={`${styles.chatRow} ${
                  chat.chatId === activeId ? styles.chatRowActive : ""
                }`}
              >
                <Avatar
                  image={chat.userImage}
                  name={chat.fullName || chat.userName}
                  size={52}
                  ring={!locked}
                />

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[14px] font-semibold">
                      {chat.userName}
                    </span>
                    {locked && (
                      <Lock
                        className="h-3 w-3 shrink-0"
                        strokeWidth={2}
                        style={{ color: "var(--muted)" }}
                      />
                    )}
                  </span>

                  <span
                    className="mt-0.5 block truncate text-[13px]"
                    style={{ color: "var(--muted)" }}
                  >
                    {chat.lastMessage ?? t.noMessagesYet}
                  </span>
                </span>

                <span
                  className="shrink-0 self-start pt-1 text-[11px]"
                  style={{ color: "var(--muted)" }}
                >
                  {chatTime(chat.lastMessageDate ?? chat.createdAt)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
