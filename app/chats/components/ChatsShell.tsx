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

import { useCall } from "../call/CallProvider";
import { useChats } from "../providers";
import styles from "../chats.module.css";

// DIQQAT: <ChatsProvider>, <CallProvider> va <CallOverlay> in jo NESTAND.
// Onho hozir dar app/layout.tsx (GlobalCall) ba TAMOMI sayt guzoshta
// shudaand - to zvanok dar har sahifa girifta shavad, na faqat dar /chats.
// Agar in jo boz yak bor guzorem, DU signaling paydo meshavad.
export default function ChatsShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Frame>{children}</Frame>;
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


  return (
    <div data-theme={theme} className={`${styles.shell} relative h-dvh overflow-hidden`}>
      <span className={styles.aura} aria-hidden />
      <span className={styles.auraLow} aria-hidden />



      {/* ================= QISMI ASOSI ================= */}
      <main className="relative z-10 h-full pt-[60px] pb-[50px] md:pb-0 md:pl-[245px] md:pt-0">
        {children}
      </main>
    </div>
  );
}
