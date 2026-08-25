import SearchShell from "./components/SearchShell";

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <SearchShell>{children}</SearchShell>;
}
