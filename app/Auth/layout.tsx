// ============================================================
//  app/Auth/layout.tsx
//  Ramkai umumi baroi HAR DU sahifa (login va Register).
//  Hamai dizayn dar <AuthShell> ast.
// ============================================================
import AuthShell from "./components/AuthShell";

export default function AuthLayout({ children }: LayoutProps<"/Auth">) {
  return <AuthShell>{children}</AuthShell>;
}
