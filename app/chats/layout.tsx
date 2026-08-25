// ============================================================
//  app/chats/layout.tsx
//  Ramkai umumi baroi /chats.
//
//  DIQQAT: <Sidebar /> va <SessionProvider> in jo NESTAND!
//  Onho YAK JOI hastand - dar app/layout.tsx (components/AppFrame.tsx)
//  va ba HAMAI sayt kor mekunad. Agar in jo takror kuni,
//  DU sidebar va DU so-rovi profil paydo meshavad.
//  Dizayni daruni sahifa dar <ChatsShell> ast.
// ============================================================
import ChatsShell from "./components/ChatsShell";

export default function Layout({ children }: LayoutProps<"/chats">) {
  return <ChatsShell>{children}</ChatsShell>;
}
