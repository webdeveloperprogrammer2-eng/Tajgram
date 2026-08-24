import type { ReactNode } from "react";
import { PageTransition } from "@/components/PageTransition";
import { SessionProvider } from "@/components/SessionProvider";
import { Sidebar } from "@/components/Sidebar";

/** Каркас приложения: боковая навигация + область страницы. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <Sidebar />
      <main className="min-h-dvh pb-[50px] pt-[60px] md:pb-0 md:pl-[245px] md:pt-0">
        <PageTransition>{children}</PageTransition>
      </main>
    </SessionProvider>
  );
}
