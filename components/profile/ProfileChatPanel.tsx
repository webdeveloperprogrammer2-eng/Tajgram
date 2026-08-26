"use client";

// ============================================================
//  components/profile/ProfileChatPanel.tsx
//
//  SUHBAT DAR DOKHILI PROFIL.
//
//  Peshtar tugmai "Payom" dar profili korbari digar faqat
//  router.push("/chats") mekard: korbar az profil BERUN
//  meparid va on jo boz mebayad hamon odamro dar ro-ykhat
//  meyoft. Yane "payom navishtan" du qadam dosht va profil
//  gum meshud.
//
//  Hozir hamon tugma HAMIN oynaro dar boloi profil mekushoyad:
//    1. suhbat bo in odam dar ro-ykhat hast -> hamonro megirem
//    2. nest -> POST /Chat/create-chat -> suhbati nav
//  Va daruni oyna AYNAN hamon <ChatWindow>-i /chats kor mekunad
//  (payomho, surat, ovoz, zvanok) - hech chizi takrori nest.
//
//  <ChatsProvider> dar app/layout.tsx (daruni GlobalCall) ast,
//  baroi hamin useChats() dar profil ham dastras ast.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import {
  createChat,
  errorText,
  getChats,
  type Chat,
} from "@/app/chats/api";
import { sameId } from "@/app/chats/call/realtime";
import { useChats } from "@/app/chats/providers";
import ChatWindow from "@/app/chats/components/ChatWindow";
import { useT } from "@/components/LocaleProvider";
import { tr } from "@/components/appLang";

export type ProfileChatPanelProps = {
  open: boolean;
  onClose: () => void;

  /** Hamsuhbat - az profile ki kushoda istodaem. */
  userId: string;
  userName: string;
  fullName: string;
  image: string | null;
};

export function ProfileChatPanel({
  open,
  onClose,
  userId,
  userName,
  fullName,
  image,
}: ProfileChatPanelProps) {
  const { t } = useT();
  const { token, chats, reloadChats, reloadAllowed, status } = useChats();

  const [chat, setChat] = useState<Chat | null>(null);
  const [error, setError] = useState("");

  // Baroi yak odam FAQAT yak bor "create-chat" mefiristem.
  const created = useRef<string>("");

  // ---------- Suhbatro meyobem yo mesozem ----------
  useEffect(() => {
    if (!open || userId.trim() === "") return;

    let alive = true;

    queueMicrotask(() => {
      if (alive) setError("");
    });

    // 1) Allakay dar ro-ykhat hast? -> darhol namoyon mekunem,
    //    hech so-rovi ilovagi lozim nest.
    const known = chats.find((item) => sameId(item.userId, userId)) ?? null;
    if (known !== null) {
      queueMicrotask(() => {
        if (alive) setChat(known);
      });
      return () => {
        alive = false;
      };
    }

    // 2) Nest -> suhbati nav mesozem (yak bor).
    if (created.current === userId) return;
    created.current = userId;

    (async () => {
      try {
        const chatId = await createChat(token, userId);

        // Ro-ykhati toza - to nomi durust va oxirin payom oyad
        const fresh = await getChats(token).catch(() => [] as Chat[]);
        const found =
          (Array.isArray(fresh) ? fresh : []).find(
            (item) => item.chatId === chatId,
          ) ?? null;

        void reloadChats();

        if (!alive) return;

        setChat(
          found ?? {
            chatId,
            userId,
            userName,
            fullName,
            userImage: image,
            lastMessage: null,
            lastMessageDate: null,
            createdAt: new Date().toISOString(),
          },
        );
      } catch (cause) {
        if (alive) setError(errorText(cause, tr().chatOpenFailed));
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, token, chats]);

  // Oyna basta shud -> holatro toza mekunem, to bori digar
  // suhbati KUHNA yak lahza namoyon nashavad.
  useEffect(() => {
    if (open) return;
    created.current = "";
    queueMicrotask(() => {
      setChat(null);
      setError("");
    });
  }, [open]);

  // Ro-ykhati "bo ki navishtan mumkin" gohe kuhna ast (masalan
  // hozir hamin dam obuna shudem). Be in ChatWindow maidoni
  // navishtanro BASTA menamud.
  useEffect(() => {
    if (!open) return;
    void reloadAllowed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  // ---------- Esc va qulfi varaq ----------
  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Suhbat bo ${userName}`}
      onClick={onClose}
      // z-80: kamtar az CallOverlay (z-90) - to oynai zvanok
      // hamesha dar bolo bosad.
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-6"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="animate-fade-up relative flex h-dvh w-full flex-col overflow-hidden border-[var(--line)] bg-[var(--bg)] shadow-2xl sm:h-[min(680px,88dvh)] sm:w-[min(560px,100%)] sm:rounded-2xl sm:border"
      >
        {/* Bastan - dar kompyuter tugmai "bozgasht"-i ChatWindow
            faqat dar telefon namoyon ast (md:hidden). */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute top-3 right-3 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-[var(--panel)] text-[var(--fg)] transition-transform duration-200 hover:brightness-95 active:scale-95 md:inline-flex"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>

        {error !== "" ? (
          <Center>
            <p className="text-[14px]" style={{ color: "var(--signal)" }}>
              {error}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[var(--panel)] px-4 py-2 text-[13px] font-semibold"
            >
              {t.close}
            </button>
          </Center>
        ) : status === "guest" ? (
          <Center>
            <p className="text-[14px]" style={{ color: "var(--muted)" }}>
              {t.signInToWrite}
            </p>
          </Center>
        ) : chat === null ? (
          <Center>
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accentA)]" />
            <span className="sr-only">{t.openingChat}</span>
          </Center>
        ) : (
          <ChatWindow key={chat.chatId} chat={chat} onBack={onClose} />
        )}
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      {children}
    </div>
  );
}
