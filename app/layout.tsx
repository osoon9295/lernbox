import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Lernbox",
    template: "%s | Lernbox",
  },
  description:
    "AI가 독일어 단어를 예문·뉘앙스와 함께 풀어주고, 간격 반복(SRS)으로 복습 일정을 관리해주는 개인 학습 도구.",
  keywords: ["독일어", "단어장", "SRS", "간격 반복", "AI", "학습"],
  authors: [{ name: "osoon9295" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
