// ============================================================
//  app/getInfoUsers/layout.tsx
//  Ramkai umumi baroi sahifai profili KORBARI DIGAR.
// ============================================================
import UserShell from "./components/UserShell";

export default function UserLayout({ children }: LayoutProps<"/getInfoUsers">) {
  return <UserShell>{children}</UserShell>;
}
