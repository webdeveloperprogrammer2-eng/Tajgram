import type { ReactNode } from "react";
import { PageTransition } from "@/components/PageTransition";

/** Отступ под общий сайдбар из корневого layout. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh pb-[50px] pt-[60px] md:pb-0 md:pl-[245px] md:pt-0">
      <PageTransition>{children}</PageTransition>
    </main>
  );
}
