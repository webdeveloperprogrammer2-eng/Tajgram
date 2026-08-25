"use client";

// ============================================================
//  app/chats/page.tsx  ->  adres: /chats
//
//  Do sutun (monandi instagram Direct):
//    chap  - ro-ykhati suhbatho (ChatList)
//    rost  - khudi suhbat (ChatWindow)
//
//  Dar telefon: yak sutun. Vaqte suhbat kushoda shud -
//  ro-ykhat penhon meshavad, tugmai bozgasht namoyon.
//
//  Holatho: loading / guest / error / ready
// ============================================================
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LockKeyhole, MessagesSquare, TriangleAlert } from "lucide-react";

import { type Chat } from "./api";
import { useChats } from "./providers";
import styles from "./chats.module.css";

import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import NewChatModal from "./components/NewChatModal";

export default function ChatsPage() {
  // useSearchParams -> Suspense talab mekunad
  return (
    <Suspense fallback={<LoadingView />}>
      <ChatsView />
    </Suspense>
  );
}

function ChatsView() {
  const { status, error, reload, chats, reloadChats } = useChats();
  const params = useSearchParams();

  const [activeId, setActiveId] = useState<number | null>(null);

  // Agar az sahifai digar bo /chats?chatId=12 omada bosem -
  // hamon suhbatro darhol mekushoem.
  useEffect(() => {
    const fromUrl = Number(params.get("chatId"));
    if (Number.isFinite(fromUrl) && fromUrl > 0) setActiveId(fromUrl);
  }, [params]);
  const [newChatOpen, setNewChatOpen] = useState(false);

  // ---------- 1. Hanuz bor meshavad ----------
  if (status === "loading") {
    return <LoadingView />;
  }

  // ---------- 2. Token nest ----------
  if (status === "guest") {
    return (
      <Center>
        <span
          className={`${styles.gradBg} flex h-14 w-14 items-center justify-center rounded-2xl`}
        >
          <LockKeyhole className="h-6 w-6" strokeWidth={1.8} />
        </span>

        <h1 className="text-2xl font-bold tracking-tight">Avval daroed</h1>

        <p
          className="max-w-sm text-sm leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          Baroi didani payomho boyad ba account daroed.
        </p>

        <Link
          href="/Auth/login"
          className={`${styles.gradBg} rounded-full px-6 py-3 text-sm font-semibold`}
        >
          Ba login raftan
        </Link>
      </Center>
    );
  }

  // ---------- 3. Khatoi server ----------
  if (status === "error") {
    return (
      <Center>
        <span
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[13px]"
          style={{ background: "var(--panel)", color: "var(--signal)" }}
        >
          <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          {error}
        </span>

        <button
          type="button"
          onClick={() => reload()}
          className="rounded-full px-6 py-3 text-sm font-semibold"
          style={{ background: "var(--panel)", color: "var(--fg)" }}
        >
          Boz yak bor sanjed
        </button>
      </Center>
    );
  }

  // ---------- 4. Hama chiz tayyor ----------
  const active = chats.find((chat) => chat.chatId === activeId) ?? null;

  function handleSelect(chat: Chat) {
    setActiveId(chat.chatId);
  }

  async function handleCreated(chatId: number) {
    // Ro-ykhatro az server az nav megirem - chati nav dar on peydo meshavad
    await reloadChats();
    setActiveId(chatId);
  }

  return (
    <div className="flex h-full">
      {/* ---------- CHAP: ro-ykhat ---------- */}
      <div
        className={`${
          active === null ? "flex" : "hidden"
        } h-full w-full flex-col border-r md:flex md:w-[340px] md:shrink-0 xl:w-[380px]`}
        style={{ borderColor: "var(--line)" }}
      >
        <ChatList
          activeId={activeId}
          onSelect={handleSelect}
          onNewChat={() => setNewChatOpen(true)}
        />
      </div>

      {/* ---------- ROST: suhbat ---------- */}
      <div
        className={`${
          active === null ? "hidden" : "flex"
        } h-full min-w-0 flex-1 flex-col md:flex`}
      >
        {active === null ? (
          <EmptyRight onNewChat={() => setNewChatOpen(true)} />
        ) : (
          <ChatWindow
            key={active.chatId}
            chat={active}
            onBack={() => setActiveId(null)}
          />
        )}
      </div>

      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onCreated={(chatId) => handleCreated(chatId)}
      />
    </div>
  );
}

// ------------------------------------------------------------
function EmptyRight({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className={`${styles.rise} flex h-full flex-col items-center justify-center gap-5 px-8 text-center`}>
      <span
        className="flex h-20 w-20 items-center justify-center rounded-full border-2"
        style={{ borderColor: "var(--fg)" }}
      >
        <MessagesSquare className="h-9 w-9" strokeWidth={1.4} />
      </span>

      <h2 className="text-xl font-bold tracking-tight">Payomhoi shumo</h2>

      <p
        className="max-w-xs text-sm leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        Yak suhbatro intikhob kuned yo bo doston suhbati nav sar kuned.
      </p>

      <button
        type="button"
        onClick={onNewChat}
        className={`${styles.gradBg} rounded-full px-6 py-3 text-sm font-semibold`}
      >
        Suhbati nav
      </button>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${styles.rise} flex h-full flex-col items-center justify-center gap-5 px-8 text-center`}
    >
      {children}
    </div>
  );
}

function LoadingView() {
  return (
    <div className="flex h-full">
      <div
        className="hidden h-full w-[340px] shrink-0 flex-col gap-3 border-r p-5 md:flex xl:w-[380px]"
        style={{ borderColor: "var(--line)" }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={styles.skeleton} style={{ height: 52, width: 52, borderRadius: 999 }} />
            <div className="flex-1 space-y-2">
              <div className={styles.skeleton} style={{ height: 12, width: "55%", borderRadius: 999 }} />
              <div className={styles.skeleton} style={{ height: 10, width: "80%", borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 items-center justify-center">
        <span className={styles.blocks} style={{ color: "var(--muted)" }}>
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}
