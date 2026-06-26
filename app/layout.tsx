import type { Metadata } from "next";
import { Nunito, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { YandexMetrika } from "@/components/YandexMetrika";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
const FEEDBACK_FORM_URL = "https://forms.gle/aYxTWXKvxaSqmDNy8";

export const metadata: Metadata = {
  title: "Эрудит — играть онлайн",
  description:
    "Бесплатная онлайн-версия настольной игры Эрудит: с друзьями, с ботом, с незнакомцами или за одним экраном.",
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/logo.png", sizes: "120x120", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
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
        <div className="min-h-screen relative overflow-x-hidden flex flex-col">
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
          <main className="relative z-10 flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
            {children}
          </main>
          <footer className="relative z-10 border-t border-[var(--color-border)] bg-[var(--color-paper)]">
            <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[var(--color-ink-muted)]">
              <a
                href={FEEDBACK_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-board)] transition-colors"
              >
                Сообщить об ошибке
              </a>
              <span className="text-[var(--color-ink-faint)]" aria-hidden="true">
                ·
              </span>
              <a
                href={FEEDBACK_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-board)] transition-colors"
              >
                Предложить идею
              </a>
            </div>
          </footer>
        </div>
        <YandexMetrika />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
