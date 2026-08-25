"use client";

// ============================================================
//  app/chats/call/GlobalCall.tsx
//
//  CHARO IN LOZIM AST?
//  Peshtar <CallProvider> FAQAT daruni ChatsShell (/chats) bud.
//  Yane signaling (long polling) faqat on vaqt kor mekard,
//  ki hamsuhbat AYNI HAMON DAM sahifai /chats-ro kushoda bosad.
//  Agar u dar lenta, profil, reels yo justuju bosad - hech kas
//  napursid "baroi man zvanok hast?" -> ZANG BA U NAMERASID
//  (dar zangzananda animatsiya mekard va ba'd "Javob nadodand").
//
//  Hozir in qabat dar app/layout.tsx ast -> dar HAMAI sahifahoi
//  sayt gush mekunad va oynai zvanok (CallOverlay) dar har jo
//  boloi hama kushoda meshavad.
// ============================================================

import CallOverlay from "../components/CallOverlay";
import { ChatsProvider } from "../providers";
import { CallProvider } from "./CallProvider";

export default function GlobalCall({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatsProvider>
      <CallProvider>
        {children}
        {/* .callRoot => position:fixed; inset:0; z-index:90
            va hangomi "idle" null bar megardonad - baroi hamin
            dar hech sahifa halal namerasonad. */}
        <CallOverlay />
      </CallProvider>
    </ChatsProvider>
  );
}
