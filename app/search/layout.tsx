// ============================================================
//  app/search/layout.tsx
//  Ramkai umumi. Sidebar YAKTOST baroi hamai sayt
//  (components/Sidebar.tsx) - dizayni daruni sahifa dar <SearchShell>.
// ============================================================
import { Sidebar } from "@/components/Sidebar";
import { SessionProvider } from "@/components/SessionProvider";

import SearchShell from "./components/SearchShell";

export default function SearchLayout({ children }: LayoutProps<"/search">) {
  return (
    <SessionProvider>
      <Sidebar />
      <SearchShell>{children}</SearchShell>
    </SessionProvider>
  );
}
