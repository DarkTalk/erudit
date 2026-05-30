"use client";

import Link from "next/link";
import { HomeDemoBoard } from "@/components/HomeDemoBoard";

const MODES = [
  {
    href: "/play/friends",
    title: "Играть с друзьями",
    description: "Создайте комнату и пригласите друзей по ссылке",
    icon: "👥",
  },
  {
    href: "/play/bot",
    title: "Играть против компьютера",
    description: "Тренируйтесь против бота с выбором сложности",
    icon: "🤖",
  },
  {
    href: "/play/open",
    title: "Открытая игра",
    description: "Создайте комнату или присоединитесь к случайному сопернику",
    icon: "🌐",
  },
] as const;

export function ModePickerPage() {
  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100dvh-73px)] pt-4 pb-8">
      <div className="w-full max-w-lg text-center space-y-10">
        <div>
          <h1 className="text-[clamp(2.75rem,8vw,3.75rem)] font-bold font-serif text-[var(--color-board)] tracking-tight leading-tight">
            Эрудит
          </h1>
          <p className="text-[var(--color-ink-muted)] mt-3 text-base leading-relaxed">
            Составляйте слова, набирайте очки и покажите всем свой словарный запас!
          </p>
        </div>

        <div className="space-y-3 text-left">
          {MODES.map((mode) => (
            <Link
              key={mode.href}
              href={mode.href}
              className="flex items-start gap-4 w-full p-5 rounded-2xl bg-white border border-[var(--color-border)] shadow-sm hover:border-[var(--color-board)] hover:bg-[var(--color-board-light)] transition-all group"
            >
              <span className="text-2xl shrink-0 mt-0.5" aria-hidden>
                {mode.icon}
              </span>
              <div>
                <p className="font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-board)] transition-colors">
                  {mode.title}
                </p>
                <p className="text-sm text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                  {mode.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 pt-4">
          <Feature
            title="3 режима игры"
            desc="С друзьями, против бота, случайный соперник"
          />
          <Feature title="51 000 слов" desc="Большой словарь существительных" />
          <Feature title="Онлайн" desc="Игра в реальном времени" />
        </div>

        <HomeDemoBoard />
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <p className="font-bold text-[0.9375rem] text-[var(--color-ink)]">{title}</p>
      <p className="mt-1.5 text-[0.8125rem] text-[var(--color-ink-faint)] leading-relaxed">{desc}</p>
    </div>
  );
}
