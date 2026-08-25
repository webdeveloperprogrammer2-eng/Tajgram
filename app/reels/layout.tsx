// ============================================================
//  app/reels/layout.tsx
//  Ramkai umumi baroi /reels.
//
//  DIQQAT: <Sidebar /> va <SessionProvider> in jo NESTAND!
//  Onho YAK JOI hastand - dar app/layout.tsx (components/AppFrame.tsx)
//  va ba HAMAI sayt kor mekunand. Agar in jo takror kuni,
//  DU sidebar va DU so-rovi profil paydo meshavad.
//  Dizayni daruni sahifa dar <ReelsShell> ast.
// ============================================================
import ReelsShell from "./components/ReelsShell";

export default function Layout({ children }: LayoutProps<"/reels">) {
  return <ReelsShell>{children}</ReelsShell>;
}
