// ============================================================
//  app/chats/layout.tsx
//  Ramkai umumi baroi hamai sahifahoi /chats.
//  Hamai dizayn dar <ChatsShell> ast.
// ============================================================
import ChatsShell from "./components/ChatsShell";

export default function ChatsLayout({ children }: LayoutProps<"/chats">) {
  return <ChatsShell>{children}</ChatsShell>;
}
