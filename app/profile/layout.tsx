// ============================================================
//  app/profile/layout.tsx
//  Ramkai umumi baroi /profile.
//
//  DIQQAT: <Sidebar /> va <SessionProvider> in jo NESTAND!
//  Onho YAK JOI hastand - dar app/layout.tsx (components/AppFrame.tsx)
//  va ba HAMAI sayt kor mekunad. Agar in jo takror kuni,
//  DU sidebar va DU so-rovi profil paydo meshavad.
//  Dizayni daruni sahifa dar <ProfileShell> ast.
// ============================================================
import ProfileShell from "./components/ProfileShell";

export default function Layout({ children }: LayoutProps<"/profile">) {
  return <ProfileShell>{children}</ProfileShell>;
}
