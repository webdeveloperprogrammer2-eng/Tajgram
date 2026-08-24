// ============================================================
//  app/profile/layout.tsx
//  Ramkai umumi baroi hamai sahifahoi /profile.
//  Hamai dizayn dar <ProfileShell> ast.
// ============================================================
import ProfileShell from "./components/ProfileShell";

export default function ProfileLayout({ children }: LayoutProps<"/profile">) {
  return <ProfileShell>{children}</ProfileShell>;
}
