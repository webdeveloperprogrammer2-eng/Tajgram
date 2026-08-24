// ============================================================
//  app/profile/layout.tsx
//  Ramkai umumi. Sidebar YAKTOST baroi hamai sayt
//  (components/Sidebar.tsx) - dizayni daruni sahifa dar <ProfileShell>.
// ============================================================
import { Sidebar } from "@/components/Sidebar";
import { SessionProvider } from "@/components/SessionProvider";

import ProfileShell from "./components/ProfileShell";

export default function Layout({ children }: LayoutProps<"/profile">) {
  return (
    <SessionProvider>
      <Sidebar />
      <ProfileShell>{children}</ProfileShell>
    </SessionProvider>
  );
}
