import type { Metadata } from "next";
import { Geist, Geist_Mono, Grand_Hotel } from "next/font/google";
import { LocaleProvider } from "@/components/LocaleProvider";
import { SessionProvider } from "@/components/SessionProvider";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

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

/**
 * Навигация живёт здесь, а не в группе (app): разделы команды
 * (profile, chats, reels, search, getInfoUsers) тоже должны её видеть —
 * их оболочки уже оставляют слева отступ под сайдбар.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tg"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${grandHotel.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <LocaleProvider>
          <SessionProvider>
            <Sidebar />
            {children}
          </SessionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
