import ChatsShell from "./components/ChatsShell";

export default function ChatsLayout({ children }: { children: React.ReactNode }) {
  return <ChatsShell>{children}</ChatsShell>;
}
