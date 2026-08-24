// ============================================================
//  app/page.tsx  ->  sahifai asosi "/"
//  Holo hanuz feed nadorem, baroi hamin korbarro
//  darhol ba sahifai daromadan mefiristem.
// ============================================================
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/Auth/login");
}
