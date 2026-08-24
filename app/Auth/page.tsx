// ============================================================
//  app/Auth/page.tsx  ->  adres: /Auth
//  Agar kase faqat "/Auth"-ro kushoyad, uro ba login mefiristem.
// ============================================================
import { redirect } from "next/navigation";

export default function AuthPage() {
  redirect("/Auth/login");
}
