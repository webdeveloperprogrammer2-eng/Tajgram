"use client";

// ============================================================
//  ChatMenu - tugmai SOZISH dar sarlavhai suhbat ("...").
//
//  Daruni on:
//    1. Sado        - sadoi payomi nav khomush / yoqun
//    2. Ogohinoma   - payom meoyad, vale "vsplivayushiy" NE
//    3. Blok kardan - POST /Settings/block-user
//    4. Tark kardani suhbat - DELETE /Chat/delete-chat
//
//  Nuqtahoi 1 va 2 dar HAMIN browser nigoh doshta meshavand
//  (chatPrefs.ts) - dar backend baroi onho endpoint nest.
//  Nuqtai 3 va 4 az backend-i haqiqi meguzarand.
// ============================================================
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  MoreVertical,
  ShieldBan,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";

import { blockUser, deleteChat, errorText, type Chat } from "../api";
import {
  dropChatPrefs,
  onChatPrefsChange,
  readChatPrefs,
  writeChatPrefs,
  type ChatPrefs,
} from "../chatPrefs";
import { useChats } from "../providers";
import styles from "../chats.module.css";

import { useT } from "@/components/LocaleProvider";

export default function ChatMenu({
  chat,
  peerId,
  onGone,
  onError,
}: {
  chat: Chat;
  /** userId-i HAQIQI-i hamsuhbat (az ChatWindow meoyad) */
  peerId: string;
  /** Blok shud yo suhbat tark shud -> ba ro-ykhat bar megardem */
  onGone: () => void;
  onError: (text: string) => void;
}) {
  const { t } = useT();
  const { token, reloadChats, reloadAllowed } = useChats();

  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<ChatPrefs>({
    muteSound: false,
    muteNotify: false,
  });

  // "block" yo "delete" - kadom kor tasdiqro intizor ast
  const [ask, setAsk] = useState<"block" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);

  const box = useRef<HTMLDivElement>(null);

  // localStorage faqat dar browser hast -> ba'di render mekhonem
  useEffect(() => {
    setPrefs(readChatPrefs(chat.chatId));
    return onChatPrefsChange(() => setPrefs(readChatPrefs(chat.chatId)));
  }, [chat.chatId]);

  // Beruni menyu zadand yo Esc - menyu basta meshavad
  useEffect(() => {
    if (!open) return;

    function onDown(event: MouseEvent) {
      if (box.current !== null && !box.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Suhbat ivaz shud - menyu basta boshad
  useEffect(() => {
    setOpen(false);
    setAsk(null);
  }, [chat.chatId]);

  function toggle(key: keyof ChatPrefs) {
    setPrefs(writeChatPrefs(chat.chatId, { [key]: !prefs[key] }));
  }

  // ---------- Blok kardan ----------
  async function doBlock() {
    const target = peerId.trim() !== "" ? peerId : chat.userId;

    if (target.trim() === "") {
      onError(t.blockFailed);
      setAsk(null);
      return;
    }

    setBusy(true);
    try {
      await blockUser(token, target);

      // Blok podpiskaro dar HAR DU taraf me-burad -> ro-ykhati
      // "bo ki navishtan mumkin" bояd az nav girifta shavad,
      // be in maidoni navishtan hanuz kushoda memonad.
      await reloadAllowed();
      await reloadChats();

      setAsk(null);
      setOpen(false);
      onGone();
    } catch (err) {
      onError(errorText(err, t.blockFailed));
      setAsk(null);
    } finally {
      setBusy(false);
    }
  }

  // ---------- Tark kardani suhbat ----------
  async function doDelete() {
    setBusy(true);
    try {
      await deleteChat(token, chat.chatId);
      dropChatPrefs(chat.chatId);
      await reloadChats();

      setAsk(null);
      setOpen(false);
      onGone();
    } catch (err) {
      onError(errorText(err, t.chatDeleteFailed));
      setAsk(null);
    } finally {
      setBusy(false);
    }
  }

  const name = chat.userName || chat.fullName;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((old) => !old)}
        aria-label={t.chatSettings}
        title={t.chatSettings}
        aria-haspopup="menu"
        aria-expanded={open}
        className={styles.headBtn}
      >
        <MoreVertical className="h-5 w-5" strokeWidth={1.8} />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <p className={styles.menuTitle}>{name}</p>

          {/* ---------- 1. Sado ---------- */}
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={prefs.muteSound}
            onClick={() => toggle("muteSound")}
            className={styles.menuItem}
          >
            {prefs.muteSound ? (
              <VolumeX className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            ) : (
              <Volume2 className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            )}

            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate">
                {prefs.muteSound ? t.soundOn : t.soundOff}
              </span>
              <span className={styles.menuHint}>{t.soundHint}</span>
            </span>

            <span
              className={`${styles.dot} ${prefs.muteSound ? styles.dotOn : ""}`}
              aria-hidden
            />
          </button>

          {/* ---------- 2. Ogohinoma ---------- */}
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={prefs.muteNotify}
            onClick={() => toggle("muteNotify")}
            className={styles.menuItem}
          >
            {prefs.muteNotify ? (
              <BellOff className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            ) : (
              <Bell className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            )}

            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate">
                {prefs.muteNotify ? t.notifyOn : t.notifyOff}
              </span>
              <span className={styles.menuHint}>{t.notifyHint}</span>
            </span>

            <span
              className={`${styles.dot} ${prefs.muteNotify ? styles.dotOn : ""}`}
              aria-hidden
            />
          </button>

          <span className={styles.menuLine} aria-hidden />

          {/* ---------- 3. Blok ---------- */}
          <button
            type="button"
            role="menuitem"
            onClick={() => setAsk("block")}
            className={`${styles.menuItem} ${styles.menuDanger}`}
          >
            <ShieldBan className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="min-w-0 flex-1 truncate text-left">
              {t.blockUser}
            </span>
          </button>

          {/* ---------- 4. Tark kardani suhbat ---------- */}
          <button
            type="button"
            role="menuitem"
            onClick={() => setAsk("delete")}
            className={`${styles.menuItem} ${styles.menuDanger}`}
          >
            <Trash2 className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="min-w-0 flex-1 truncate text-left">
              {t.deleteChat}
            </span>
          </button>
        </div>
      )}

      {/* ---------- Pursish (blok / tark) ---------- */}
      {ask !== null && (
        <>
          <div
            className={styles.overlay}
            onClick={() => {
              if (!busy) setAsk(null);
            }}
          />

          <div className={styles.modal} role="dialog" aria-modal="true">
            <div className="space-y-3 p-6">
              <h2 className="text-[16px] font-semibold">
                {ask === "block" ? t.blockUser : t.deleteChat}
              </h2>

              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                {ask === "block" ? t.blockAsk : t.deleteChatAsk}
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setAsk(null)}
                  className="rounded-full px-5 py-2.5 text-[13px] font-semibold"
                  style={{ background: "var(--panel)", color: "var(--fg)" }}
                >
                  {t.cancel}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void (ask === "block" ? doBlock() : doDelete())}
                  className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-white"
                  style={{ background: "var(--signal)", opacity: busy ? 0.6 : 1 }}
                >
                  {busy ? t.pleaseWait : t.confirmYes}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
