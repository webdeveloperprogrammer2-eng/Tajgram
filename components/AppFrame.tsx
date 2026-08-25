"use client";

// ============================================================
//  components/AppFrame.tsx
//
//  YAK JOI YAGONA ki <Sidebar /> ba sahifa meguzorad.
//
//  CHARO IN LOZIM AST?
//  Peshtar har bakhsh (chats, profile, reels, search) dar
//  layout-i KHUD <SessionProvider> va <Sidebar /> menavisht,
//  va app/(app) umuman sidebar nadosht (faqat joi kholi-i
//  245px). Natija:
//    1) dar lenta va /getInfoUsers sidebar tamoman nabud;
//    2) har taghyiri sidebar 5 fayl-ro daroz mekard ->
//       hangomi merge HAMESHA konflikt medod.
//
//  Hozir sidebar FAQAT az app/layout.tsx meoyad. Bakhshho
//  ba on dast namerasonand -> konflikt ham nameshavad.
// ============================================================
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SessionProvider } from "./SessionProvider";
import { Sidebar } from "./Sidebar";

// Sahifahoi BE sidebar: voridshavi va sabtinom.
// Dar in jo SessionProvider ham kor namekunad - to sahifai
// login token-i akkaunti khizmatiro ba localStorage naguzorad.
const BARE_ROUTES = ["/Auth"];

function isBare(pathname: string) {
  return BARE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isBare(pathname)) return <>{children}</>;

  return (
    <SessionProvider>
      <Sidebar />
      {children}
    </SessionProvider>
  );
}
