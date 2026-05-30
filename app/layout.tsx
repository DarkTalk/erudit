import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Эрудит — играй с друзьями",
  description: "Онлайн-версия настольной игры Эрудит для компании друзей",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]`}
      >
        <div className="min-h-screen relative overflow-x-hidden">
          <header className="relative z-10 border-b border-[var(--color-border)] bg-white/70 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
              <a
                href="/"
                className="text-xl font-bold font-serif text-[var(--color-board)] hover:text-[var(--color-board-hover)] transition-colors tracking-tight"
              >
                Эрудит
              </a>
            </div>
          </header>
          <main className="relative z-10 max-w-6xl mx-auto px-4 py-6">
            {children}
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
