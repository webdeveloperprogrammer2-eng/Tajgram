// ============================================================
//  app/chats/layout.tsx
//  Ramkai umumi. Sidebar YAKTOST baroi hamai sayt
//  (components/Sidebar.tsx) - dizayni daruni sahifa dar <ChatsShell>.
// ============================================================
import { Sidebar } from "@/components/Sidebar";
import { SessionProvider } from "@/components/SessionProvider";

import ChatsShell from "./components/ChatsShell";

export default function Layout({ children }: LayoutProps<"/chats">) {
  return (
    <SessionProvider>
      <Sidebar />
      <ChatsShell>{children}</ChatsShell>
    </SessionProvider>
  );
}
