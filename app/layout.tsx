import type { Metadata } from "next";
import { Nunito, Playfair_Display } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-dm-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Эрудит — играй с друзьями",
  description: "Онлайн-версия настольной игры Эрудит для компании друзей",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body
        className={`${nunito.variable} ${playfair.variable} antialiased min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-sans`}
      >
        <div className="min-h-screen relative overflow-x-hidden">
          <header className="relative z-10 bg-[var(--color-paper)]">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
              <a
                href="/"
                className="text-xl font-semibold font-serif text-[var(--color-board)] hover:text-[var(--color-board-hover)] transition-colors tracking-tight"
              >
                Эрудит
              </a>
            </div>
          </header>
          <main className="relative z-10 max-w-6xl mx-auto px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
