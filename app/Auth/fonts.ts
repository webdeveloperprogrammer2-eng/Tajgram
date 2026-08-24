// ============================================================
//  app/Auth/fonts.ts
//  Shrifti "editorial" baroi sarlavhahoi kalon.
//  Playfair Display - shrifti majalahoi mud (Vogue va monandi on).
//  Kirillitsa dorad -> tojiki va rusi ham zebo menamoyad.
//  Faqat dar papkai Auth kor mekunad - globals.css daste namekhorad.
// ============================================================
import { Playfair_Display } from "next/font/google";

export const editorial = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});
