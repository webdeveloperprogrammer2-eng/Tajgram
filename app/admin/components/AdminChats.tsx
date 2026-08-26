"use client";

// ============================================================
//  AdminChats - чатҳои як корбар дар панели админ.
//  Ду ҳолат: рӯйхати чатҳо -> перепискаи як чат.
//  Маълумот аз /Admin/* (backend) меояд. Агар аккаунт админ
//  набошад, паёми равшан нишон дода мешавад.
// ============================================================
import { useCallback, useEffect, useState } from "react";
import {
  MessagesSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldAlert,
  Phone,
  Mic,
} from "lucide-react";

import { api, mediaUrl, NotAdminError } from "@/lib/api";
import type { Chat, ChatMessage } from "@/lib/types";

export function AdminChats({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [error, setError] = useState<{ admin: boolean; text: string } | null>(
    null,
  );
  const [open, setOpen] = useState<Chat | null>(null);

  const load = useCallback(() => {
    setError(null);
    setChats(null);
    api
      .adminUserChats(userId)
      .then((list) => setChats(list ?? []))
      .catch((e) => {
        setChats([]);
        setError({
          admin: e instanceof NotAdminError,
          text: e instanceof Error ? e.message : "Хатогӣ",
        });
      });
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-14 text-center"
        style={{ borderColor: "var(--lineStrong)" }}
      >
        <ShieldAlert className="h-8 w-8 text-[var(--danger)]" />
        <p className="max-w-md text-sm font-semibold text-[var(--fg)]">
          {error.admin
            ? "Аккаунти шумо дар backend ҳуқуқи администраторӣ надорад."
            : "Чатҳоро гирифта нашуд."}
        </p>
        <p className="max-w-md text-xs text-[var(--muted)]">
          {error.admin
            ? "Backend гурӯҳи /Admin/*-ро дорад, вале ин аккаунтро ҳамчун администратор эътироф намекунад. Барои фаъол шудани чатҳо, backend бояд ба ин аккаунт нақши admin диҳад."
            : error.text}
        </p>
        <button
          onClick={load}
          className="mt-1 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--panel)]"
          style={{ borderColor: "var(--lineStrong)" }}
        >
          Аз нав кӯшиш
        </button>
      </div>
    );
  }

  if (chats === null) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  if (open) {
    return (
      <ChatThread chat={open} onBack={() => setOpen(null)} />
    );
  }

  if (chats.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-14 text-center"
        style={{ borderColor: "var(--lineStrong)" }}
      >
        <MessagesSquare className="h-8 w-8 text-[var(--muted)]" />
        <p className="text-sm text-[var(--muted)]">
          @{userName} ягон чат надорад.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {chats.map((c) => {
        const img = mediaUrl(c.userImage);
        return (
          <li key={c.chatId}>
            <button
              onClick={() => setOpen(c)}
              className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition hover:bg-[var(--panel)]"
            >
              <div
                className="h-11 w-11 shrink-0 overflow-hidden rounded-full"
                style={{ background: "var(--panel)" }}
              >
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-bold text-[var(--muted)]">
                    {(c.userName || "?").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[var(--fg)]">
                  {c.fullName || c.userName}
                </p>
                <p className="truncate text-xs text-[var(--muted)]">
                  {c.lastMessage || "…"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ------------------------------------------------------------
//  Переписка (як чат)
// ------------------------------------------------------------
function ChatThread({ chat, onBack }: { chat: Chat; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessages(null);
    setError(null);
    api
      .adminChatMessages(chat.chatId)
      .then((list) => setMessages(list ?? []))
      .catch((e) => {
        setMessages([]);
        setError(e instanceof Error ? e.message : "Хатогӣ");
      });
  }, [chat.chatId]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--fg)] hover:bg-[var(--panel)]"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-bold text-[var(--fg)]">
          {chat.fullName || chat.userName}
        </p>
        <span className="text-xs text-[var(--muted)]">@{chat.userName}</span>
      </div>

      {messages === null ? (
        <div className="flex justify-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
        </div>
      ) : error ? (
        <p className="py-10 text-center text-sm text-[var(--danger)]">{error}</p>
      ) : messages.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--muted)]">
          Ягон паём нест.
        </p>
      ) : (
        <div
          className="max-h-[46vh] space-y-2 overflow-y-auto rounded-2xl border p-3"
          style={{ borderColor: "var(--line)", background: "var(--panelSoft)" }}
        >
          {messages.map((m) => (
            <MessageBubble key={m.messageId} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ m }: { m: ChatMessage }) {
  const mine = m.isMine; // аз нигоҳи сохиби чат
  const media = mediaUrl(m.fileName);
  const isCall = m.kind === "call" || m.callId != null;
  const isVoice = m.kind === "voice" || (m.durationSeconds ?? 0) > 0;

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[78%] rounded-2xl px-3.5 py-2 text-sm"
        style={{
          background: mine ? "var(--accentA)" : "var(--panel)",
          color: mine ? "#fff" : "var(--fg)",
        }}
      >
        <p className="mb-0.5 text-[11px] font-semibold opacity-70">
          {m.userName}
        </p>

        {isCall ? (
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            {m.callType || "Занг"} · {m.callStatus || ""}
          </span>
        ) : isVoice ? (
          <span className="flex items-center gap-1.5">
            <Mic className="h-3.5 w-3.5" />
            Паёми овозӣ {m.durationSeconds ? `· ${m.durationSeconds}с` : ""}
          </span>
        ) : media && !m.messageText ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media}
            alt=""
            className="max-h-52 rounded-lg object-cover"
          />
        ) : (
          <span className="whitespace-pre-wrap break-words">
            {m.messageText}
          </span>
        )}

        <p className="mt-0.5 text-right text-[10px] opacity-60">
          {new Date(m.dateSent).toLocaleString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
