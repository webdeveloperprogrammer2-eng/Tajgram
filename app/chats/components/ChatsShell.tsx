"use client";

// ============================================================
//  ChatsShell - ramkai umumi baroi /chats.
//  Ayni hamon dizayni /profile: sidebar-i chap (kompyuter),
//  qatori boloi shishagi (telefon), nurhoi narmi gradient.
//
//  REAL TIME: sidebar/ro-ykhati chatho ham fori nav meshavad -
//  ham vaqte suhbat kushoda ast, ham vaqte digar chat kushoda ast.
// ============================================================
import { useEffect, useRef } from "react";

import { CallProvider, useCall } from "../call/CallProvider";
import { ChatsProvider, useChats } from "../providers";
import styles from "../chats.module.css";

import CallOverlay from "./CallOverlay";

export default function ChatsShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatsProvider>
      <CallProvider>
        <Frame>{children}</Frame>
      </CallProvider>
    </ChatsProvider>
  );
}


function Frame({ children }: { children: React.ReactNode }) {
  const { theme, reloadChats } = useChats();
  const { onChatEvent } = useCall();

  // REAL TIME: har payomi nav -> ro-ykhati chatho fori nav meshavad
  // (payomi okhirin va tartibi chatho)
  const reloadRef = useRef(reloadChats);
  useEffect(() => {
    reloadRef.current = reloadChats;
  }, [reloadChats]);

  useEffect(
    () => onChatEvent(() => void reloadRef.current()),
    [onChatEvent]
  );

  // Modal-ho ba <body> mekashand - rangho boyad dar <html> ham bosand
  useEffect(() => {
    document.documentElement.setAttribute("data-chats-theme", theme);
    return () => {
      document.documentElement.removeAttribute("data-chats-theme");
    };
  }, [theme]);

  return (
    <div data-theme={theme} className={`${styles.shell} relative h-screen`}>
      <span className={styles.aura} aria-hidden />
      <span className={styles.auraLow} aria-hidden />



      {/* ================= QISMI ASOSI ================= */}
      <main className="relative z-10 h-full pt-[60px] pb-[50px] md:pb-0 md:pl-[245px] md:pt-0">
        {children}
      </main>

      {/* ================= ZVANOK (boloi hama) ================= */}
      <CallOverlay />
    </div>
  );
}
