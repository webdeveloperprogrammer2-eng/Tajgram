"use client";

// ============================================================
//  NewChatModal - "suhbati nav".
//
//  QOIDAI ASOSI: in jo FAQAT onhoe hastand ki
//    - ba man podpiska kardaand (get-subscribers), yo
//    - man ba onho podpiska kardaam (get-subscriptions)
//  Ro-ykhat dar providers tayyor meshavad (allowed).
//
//  Ba'di intikhob: POST /Chat/create-chat?receiverUserId=...
//  Agar suhbat alakay bosad - server hamon chatId-ro medihad.
// ============================================================
import { useState } from "react";
import { Search, X } from "lucide-react";

import { createChat, errorText, type Chat } from "../api";
import { useChats } from "../providers";
import styles from "../chats.module.css";

import Avatar from "./Avatar";

export default function NewChatModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (chatId: number, userId: string) => void;
}) {
  const { allowed, token, chats } = useChats();

  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!open) return null;

  const text = query.trim().toLowerCase();
  const list =
    text === ""
      ? allowed
      : allowed.filter(
          (user) =>
            user.userName.toLowerCase().includes(text) ||
            (user.fullName ?? "").toLowerCase().includes(text)
        );

  async function handlePick(userId: string) {
    setBusyId(userId);
    setError("");

    try {
      // Agar suhbat alakay bosad - hamonro mekushoem
      const existing: Chat | undefined = chats.find(
        (chat) => chat.userId === userId
      );

      const chatId =
        existing !== undefined
          ? existing.chatId
          : await createChat(token, userId);

      onCreated(Number(chatId), userId);
      onClose();
    } catch (err) {
      setError(errorText(err, "Suhbat soakhta nashud."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden />

      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* ---------- Sarlavha ---------- */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--line)" }}
        >
          <div>
            <h2 className="text-base font-bold tracking-tight">Suhbati nav</h2>
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted)" }}>
              Faqat onhoe ki ba shumo podpiska kardaand yo shumo ba onho
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Bastan"
            className={styles.iconBtn}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* ---------- Justuju ---------- */}
        <div className="px-5 py-4">
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2.5"
            style={{ background: "var(--panel)" }}
          >
            <Search
              className="h-4 w-4 shrink-0"
              strokeWidth={1.8}
              style={{ color: "var(--muted)" }}
            />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nomi korbar..."
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: "var(--fg)" }}
            />
          </div>
        </div>

        {/* ---------- Ro-ykhat ---------- */}
        <div className={`${styles.scroll} max-h-[46vh] px-2 pb-4`}>
          {list.length === 0 ? (
            <p
              className="px-4 py-12 text-center text-[13px] leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              {allowed.length === 0
                ? "Hanuz hech kas ba shumo podpiska nakardaast va shumo ham ba kase podpiska nakardaed."
                : "Chunin korbar yoft nashud."}
            </p>
          ) : (
            list.map((user) => (
              <button
                key={user.userId}
                type="button"
                disabled={busyId !== null}
                onClick={() => handlePick(user.userId)}
                className={`${styles.chatRow} disabled:opacity-50`}
              >
                <Avatar
                  image={user.image}
                  name={user.fullName || user.userName}
                  size={46}
                />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">
                    {user.userName}
                  </span>
                  <span
                    className="block truncate text-[12px]"
                    style={{ color: "var(--muted)" }}
                  >
                    {user.fullName}
                  </span>
                </span>

                {busyId === user.userId && (
                  <span className={styles.blocks} style={{ color: "var(--muted)" }}>
                    <i />
                    <i />
                    <i />
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {error !== "" && (
          <p
            className={`${styles.snap} px-5 pb-4 text-[12px]`}
            style={{ color: "var(--signal)" }}
          >
            {error}
          </p>
        )}
      </div>
    </>
  );
}
