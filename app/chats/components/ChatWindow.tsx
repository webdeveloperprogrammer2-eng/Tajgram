"use client";

// ============================================================
//  ChatWindow - sutuni rost: khudi suhbat.
//    GET  /Chat/get-chat-by-id?chatId=..  -> payomho (har 6 son. nav)
//    PUT  /Chat/send-message              -> payomi nav (matn + fayl)
//    DELETE /Chat/delete-message          -> payomi khudam
//
//  QOIDA: agar hamsuhbat na ba man podpiska kunad va
//  na man ba u - maidoni navishtan BASTA ast.
// ============================================================
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  Lock,
  Send,
  Trash2,
  X,
} from "lucide-react";

import {
  deleteMessage,
  errorText,
  getChatMessages,
  isImageFile,
  isVideoFile,
  mediaUrl,
  sendMessage,
  type Chat,
  type Message,
} from "../api";
import { clockTime, dayLabel } from "../format";
import { useChats } from "../providers";
import styles from "../chats.module.css";

import Avatar from "./Avatar";

export default function ChatWindow({
  chat,
  onBack,
}: {
  chat: Chat;
  onBack: () => void;
}) {
  const { token, allowedIds, reloadChats } = useChats();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  // Bo in odam navishtan mumkin ast yo ne?
  const canWrite = allowedIds.has(chat.userId);

  // ---------- Payomho: bori avval + har 6 soniya ----------
  useEffect(() => {
    let alive = true;

    async function load(first: boolean) {
      if (first) {
        setLoading(true);
        setError("");
      }

      try {
        const list = await getChatMessages(token, chat.chatId);
        if (!alive) return;

        setMessages(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!alive || !first) return;
        setError(errorText(err, "Payomho bor nashudand."));
      } finally {
        if (alive && first) setLoading(false);
      }
    }

    load(true);
    const timer = setInterval(() => load(false), 6000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [token, chat.chatId]);

  // Har bor ki payomi nav omad - ba poyon meravem
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, chat.chatId]);

  // Peshnamoishi fayli intikhobshuda (va ozod kardani on)
  useEffect(() => {
    if (file === null) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ---------- Firistodani payom ----------
  async function handleSend(event: React.FormEvent) {
    event.preventDefault();

    if (!canWrite) return;
    if (text.trim() === "" && file === null) return;

    setSending(true);
    setError("");

    try {
      const created = await sendMessage(token, {
        chatId: chat.chatId,
        text,
        file,
      });

      // Server payomi soakhtaro bar megardonad -> darhol meguzorem
      if (created) setMessages((old) => [...old, created]);
      else {
        const list = await getChatMessages(token, chat.chatId);
        setMessages(Array.isArray(list) ? list : []);
      }

      setText("");
      setFile(null);
      await reloadChats(); // dar ro-ykhat "payomi okhirin" nav shavad
    } catch (err) {
      setError(errorText(err, "Payom firistoda nashud."));
    } finally {
      setSending(false);
    }
  }

  // ---------- Tark kardani payom ----------
  async function handleDelete(messageId: number) {
    try {
      await deleteMessage(token, messageId);
      setMessages((old) => old.filter((item) => item.messageId !== messageId));
      await reloadChats();
    } catch (err) {
      setError(errorText(err, "Payom tark nashud."));
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* ---------- Sarlavhai suhbat ---------- */}
      <header
        className="flex shrink-0 items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: "var(--line)" }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Bozgasht"
          className={`${styles.iconBtn} md:hidden`}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </button>

        <Avatar
          image={chat.userImage}
          name={chat.fullName || chat.userName}
          size={44}
          ring={canWrite}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{chat.userName}</p>
          <p className="truncate text-[12px]" style={{ color: "var(--muted)" }}>
            {chat.fullName}
          </p>
        </div>
      </header>

      {/* ---------- Payomho ---------- */}
      <div className={`${styles.scroll} flex-1 px-4 py-5`}>
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={styles.skeleton}
                style={{
                  height: 44,
                  width: i % 2 === 0 ? "55%" : "40%",
                  marginLeft: i % 2 === 0 ? 0 : "auto",
                }}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p
            className="py-20 text-center text-[13px]"
            style={{ color: "var(--muted)" }}
          >
            Hanuz payom nest. Avvalin payomro shumo navised.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const newDay =
                previous === undefined ||
                new Date(previous.dateSent).toDateString() !==
                  new Date(message.dateSent).toDateString();

              return (
                <div key={message.messageId} className="flex flex-col gap-2">
                  {newDay && (
                    <span className={styles.dayChip}>
                      {dayLabel(message.dateSent)}
                    </span>
                  )}

                  <Bubble message={message} onDelete={handleDelete} />
                </div>
              );
            })}
          </div>
        )}

        <div ref={bottom} />
      </div>

      {/* ---------- Khato ---------- */}
      {error !== "" && (
        <p
          className={`${styles.snap} px-5 pb-2 text-[12px]`}
          style={{ color: "var(--signal)" }}
        >
          {error}
        </p>
      )}

      {/* ---------- Maidoni navishtan ---------- */}
      <div className="shrink-0 px-4 pb-4">
        {!canWrite ? (
          <div
            className="flex items-center gap-3 rounded-3xl px-5 py-4 text-[13px] leading-relaxed"
            style={{ background: "var(--panel)", color: "var(--muted)" }}
          >
            <Lock className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span>
              Bo in korbar navishtan mumkin nest: na u ba shumo podpiska
              kardaast, na shumo ba u.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            {/* Peshnamoishi fayl */}
            {preview !== null && (
              <div className="mb-2 flex items-center gap-3">
                <span className="relative">
                  {file !== null && file.type.startsWith("video") ? (
                    <video
                      src={preview}
                      className="h-16 w-16 rounded-2xl object-cover"
                      muted
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt=""
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    aria-label="Faylro tark kuned"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: "var(--invBg)", color: "var(--invFg)" }}
                  >
                    <X className="h-3 w-3" strokeWidth={2.4} />
                  </button>
                </span>
              </div>
            )}

            <div
              className={`${styles.composer} ${focused ? styles.composerFocus : ""}`}
            >
              <textarea
                rows={1}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(event) => {
                  // Enter = firistodan, Shift+Enter = satri nav
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend(event);
                  }
                }}
                placeholder="Payom navised..."
                className={styles.composerInput}
              />

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                aria-label="Fayl guzored"
                className={styles.iconBtn}
              >
                <ImagePlus className="h-5 w-5" strokeWidth={1.8} />
              </button>

              <input
                ref={fileInput}
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={(event) => {
                  const picked = event.target.files?.[0] ?? null;
                  event.target.value = "";
                  if (picked) setFile(picked);
                }}
              />

              <button
                type="submit"
                disabled={sending || (text.trim() === "" && file === null)}
                aria-label="Firistodan"
                className={styles.sendBtn}
              >
                {sending ? (
                  <span className={styles.blocks}>
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <Send className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
//  Yak payom. Payomhoi KHUDAM - rost va gradient.
// ------------------------------------------------------------
function Bubble({
  message,
  onDelete,
}: {
  message: Message;
  onDelete: (id: number) => void;
}) {
  const mine = message.isMine;
  const src = mediaUrl(message.fileName);

  return (
    <div
      className={`group flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
    >
      {mine && (
        <button
          type="button"
          onClick={() => onDelete(message.messageId)}
          aria-label="Payomro tark kuned"
          className="mb-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          style={{ color: "var(--muted)" }}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      )}

      <div
        className={`${mine ? styles.bubbleMine : styles.bubbleTheirs} max-w-[78%] px-4 py-2.5 sm:max-w-[65%]`}
      >
        {src !== null && isImageFile(message.fileName) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="mb-2 max-h-72 w-full rounded-2xl object-cover"
            loading="lazy"
          />
        )}

        {src !== null && isVideoFile(message.fileName) && (
          <video
            src={src}
            controls
            className="mb-2 max-h-72 w-full rounded-2xl object-cover"
          />
        )}

        {src !== null &&
          !isImageFile(message.fileName) &&
          !isVideoFile(message.fileName) && (
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="mb-1 block text-[13px] underline"
            >
              {message.fileName}
            </a>
          )}

        {message.messageText !== null && message.messageText !== "" && (
          <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
            {message.messageText}
          </p>
        )}

        <span
          className="mt-1 block text-right text-[10px]"
          style={{ opacity: 0.7 }}
        >
          {clockTime(message.dateSent)}
        </span>
      </div>
    </div>
  );
}
