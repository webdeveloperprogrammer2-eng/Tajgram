// ============================================================
//  app/reels/layout.tsx
//  Ramkai umumi. Sidebar YAKTOST baroi hamai sayt
//  (components/Sidebar.tsx) - dizayni daruni sahifa dar <ReelsShell>.
// ============================================================
import { Sidebar } from "@/components/Sidebar";
import { SessionProvider } from "@/components/SessionProvider";

import ReelsShell from "./components/ReelsShell";

export default function Layout({ children }: LayoutProps<"/reels">) {
  return (
    <SessionProvider>
      <Sidebar />
      <ReelsShell>{children}</ReelsShell>
    </SessionProvider>
  );
}
