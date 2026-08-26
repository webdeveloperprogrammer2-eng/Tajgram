"use client";

// ============================================================
//  components/AppFrame.tsx
//
//  YAK JOI YAGONA ki <Sidebar /> ba sahifa meguzorad,
//  va YAK JOI YAGONA ki mepursad: "in odam daromadaast?"
//
//  Peshtar har bakhsh (chats, profile, reels, search) dar
//  layout-i KHUD <SessionProvider> va <Sidebar /> menavisht.
//  Hozir hama az HAMIN jo meoyand.
// ============================================================
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { getToken, LOGIN_PATH } from "@/lib/auth";
import { useT } from "./LocaleProvider";
import { SessionProvider } from "./SessionProvider";
import { Sidebar } from "./Sidebar";

// Sahifahoi BE sidebar va BE sanjishi token: voridshavi, sabtinom
// va PANELI ADMIN (ki sahifai tamoman digar ast - na Tajgram).
const BARE_ROUTES = ["/Auth", "/admin"];

function isBare(pathname: string) {
  return BARE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isBare(pathname)) return <>{children}</>;

  // KHATO BUD: <LocaleProvider> soakhta shuda bud va lughati
  // purra (tj/ru/en) dosht, vale dar HECH JOI sayt VASL nashuda
  // bud. Baroi hamin useT() hamesha lughati zakhirai-i tojikiro
  // bar megardond va ivaz kardani zabon HECH KOR namekard.
  // Hozir u dar app/layout.tsx ast - bar boloi HAMAI sayt.
  return (
    <AuthGate>
      <SessionProvider>
        <Sidebar />
        {children}
      </SessionProvider>
    </AuthGate>
  );
}

/**
 * Posboni voridshavi - monandi instagram.
 *
 * Token dar localStorage ast, ya'ne SERVER onro dida nametavonad.
 * Baroi hamin sanjish dar browser meshavad. To on daм ki sanjida
 * nashudaast, HECH CHIZ namoyon nameshavad - bе in korbar yak
 * lahza sahifai kholi (be surat, be nom) medid.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<"checking" | "in">("checking");

  useEffect(() => {
    // localStorage faqat dar browser hast - baroi hamin sanjish
    // daruni queueMicrotask (hamon usuli components/Sidebar.tsx),
    // to render-i joriro az nav nakashad.
    queueMicrotask(() => {
      if (getToken() !== null) {
        setState("in");
        return;
      }

      // Ba'di daromadan korbar ba HAMON sahifa bar megardad
      const back =
        pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
      router.replace(`${LOGIN_PATH}${back}`);
    });
  }, [pathname, router]);

  if (state === "checking") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)]">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accentA)]" />
        <span className="sr-only">{t.checking}</span>
      </div>
    );
  }

  return <>{children}</>;
}
