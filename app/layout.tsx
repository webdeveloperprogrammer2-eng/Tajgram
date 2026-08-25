import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Grand_Hotel } from "next/font/google";
import "./globals.css";
import { THEME_KEY, type AppTheme } from "@/components/themeKeys";
import { ThemeSync } from "@/components/ThemeSync";
import GlobalCall from "./chats/call/GlobalCall";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Рукописный шрифт для логотипа.
const grandHotel = Grand_Hotel({
  variable: "--font-grand-hotel",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tajgram",
  description: "Tajgram — веб-приложение на Next.js",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Naqlro dar SERVER meguzorem - to safedi chashmak nazanad.
  // Skript daroxil-i React kor namekunad (React 19 onro иҷро намекунад),
  // baroi hamin qimatro az cookie megirem.
  const theme: AppTheme =
    (await cookies()).get(THEME_KEY)?.value === "light" ? "light" : "dark";

  return (
    <html
      lang="en"
      data-theme={theme}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${grandHotel.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--bg)] text-[var(--fg)] transition-colors duration-300">
        <ThemeSync />
        {/* Zvanok dar HAMAI sayt gush mekunad - na faqat dar /chats.
            Be in, zang faqat ba kase merasid ki /chats kushoda dosht. */}
        <GlobalCall>{children}</GlobalCall>
      </body>
    </html>
  );
}
