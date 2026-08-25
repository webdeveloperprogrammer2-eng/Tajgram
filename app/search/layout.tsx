// ============================================================
//  app/search/layout.tsx
//  Ramkai umumi baroi /search.
//
//  DIQQAT: <Sidebar /> va <SessionProvider> in jo NESTAND!
//  Onho YAK JOI hastand - dar app/layout.tsx (components/AppFrame.tsx)
//  va ba HAMAI sayt kor mekunand. Agar in jo takror kuni,
//  DU sidebar va DU so-rovi profil paydo meshavad.
//  Dizayni daruni sahifa dar <SearchShell> ast.
// ============================================================
import SearchShell from "./components/SearchShell";

export default function SearchLayout({ children }: LayoutProps<"/search">) {
  return <SearchShell>{children}</SearchShell>;
}
