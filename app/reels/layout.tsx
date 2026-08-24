// ============================================================
//  app/reels/layout.tsx
//  Ramkai umumi baroi hamai sahifahoi /reels.
//  Hamai dizayn dar <ReelsShell> ast.
// ============================================================
import ReelsShell from "./components/ReelsShell";

export default function ReelsLayout({ children }: LayoutProps<"/reels">) {
  return <ReelsShell>{children}</ReelsShell>;
}
