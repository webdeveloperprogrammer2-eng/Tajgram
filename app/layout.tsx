import type { Metadata } from "next";
import { Geist, Geist_Mono, Grand_Hotel } from "next/font/google";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${grandHotel.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-[#262626]">{children}</body>
    </html>
  );
}
