// ============================================================
//  app/search/layout.tsx
//  Ramkai umumi baroi sahifai /search.
// ============================================================
import SearchShell from "./components/SearchShell";

export default function SearchLayout({ children }: LayoutProps<"/search">) {
  return <SearchShell>{children}</SearchShell>;
}
