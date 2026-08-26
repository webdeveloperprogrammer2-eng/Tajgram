import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Grand_Hotel } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "./Auth/providers";
import { THEME_KEY, type AppTheme } from "@/components/themeKeys";
import { ThemeSync } from "@/components/ThemeSync";
import { AppFrame } from "@/components/AppFrame";
import { LocaleProvider } from "@/components/LocaleProvider";
import GlobalCall from "./chats/call/GlobalCall";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const grandHotel = Grand_Hotel({
  variable: "--font-grand-hotel",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tajgram",
  description: "Tajgram — веб-приложение на Next.js",
  icons: {
    icon: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme: AppTheme =
    cookieStore.get(THEME_KEY)?.value === "light" ? "light" : "dark";

  return (
    <html
      lang="en"
      data-theme={theme}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${grandHotel.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--bg)] text-[var(--fg)] transition-colors duration-300">
        <ThemeSync />
        <LocaleProvider>
          {/* Zvanok dar HAMAI sayt gush mekunad - na faqat dar /chats.
              Be in, zang faqat ba kase merasid ki /chats kushoda dosht. */}
          <GlobalCall>
            {/* Sidebar YAK JOI - daruni <AppFrame>. Bakhshho
                (chats, profile, reels, search) onro takror namekunand. */}
            <AppFrame>{children}</AppFrame>
          </GlobalCall>
        </LocaleProvider>
      </body>
    </html>
  );
}
