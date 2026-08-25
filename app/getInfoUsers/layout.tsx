import UserShell from "./components/UserShell";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <UserShell>{children}</UserShell>;
}
