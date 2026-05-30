"use client";

import Link from "next/link";
import { HomeDemoBoard } from "@/components/HomeDemoBoard";

type ModeIconName = "friends" | "bot" | "open";

const MODES: {
  href: string;
  title: string;
  description: string;
  icon: ModeIconName;
}[] = [
  {
    href: "/play/friends",
    title: "Играть с друзьями",
    description: "Создайте комнату и пригласите друзей по ссылке",
    icon: "friends",
  },
  {
    href: "/play/bot",
    title: "Играть против компьютера",
    description: "Тренируйтесь против бота с выбором сложности",
    icon: "bot",
  },
  {
    href: "/play/open",
    title: "Открытая игра",
    description: "Создайте комнату или присоединитесь к случайному сопернику",
    icon: "open",
  },
];

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
              <ModeIcon name={mode.icon} />
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

        <section className="text-left space-y-4 pt-2">
          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
            На нашем сайте вы сможете поиграть в настольную игру Эрудит бесплатно и без
            регистрации, достаточно ввести только имя. Есть 3 режима игры: можно играть с
            друзьями по ссылке, сразиться со случайным соперником или сыграть против
            компьютера (есть 3 уровня сложности).
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
            Также можно настроить режим игры: по правилам кроссворда или обычный. В обычном
            режиме слова разрешается вводить без отступов. Также есть возможность выбрать количество
            фишек в мешке, чтобы ваша игра в Эрудит была ровно той длительности, которой вы
            хотите.
          </p>
          <p className="text-sm font-medium text-[var(--color-ink)] leading-relaxed">
            Приятной игры в Эрудит!
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
            Вот 3 интересных факта про игру Эрудит:
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
          Игра появилась благодаря безработному архитектору. Эрудит был создан американским архитектором Альфредом Баттсом в 1930-х годах. После потери работы он проанализировал частоту букв в газетах и на основе этих данных распределил стоимость буквенных фишек.
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
          В русском языке самая дорогая буква - «Ф». В русской версии Эрудита буква «Ф» встречается редко, поэтому за неё начисляется много очков.
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
          Благодаря премиальным клеткам («слово ×2», «слово ×3», «буква ×2» и т. д.) опытные игроки способны набирать более 200 очков одним словом. На турнирах такие ходы часто становятся решающими.
          </p>
        </section>
      </div>
    </div>
  );
}

function ModeIcon({ name }: { name: ModeIconName }) {
  return (
    <span
      className="flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-[var(--color-board-light)] border border-[var(--color-border)] text-[var(--color-board)] group-hover:text-[var(--color-tile)] group-hover:border-[var(--color-board)]/25 transition-colors"
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        {name === "friends" && (
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        )}
        {name === "bot" && (
          <>
            <rect x="5" y="5" width="14" height="14" rx="2.5" />
            <path d="M9 9h6v6H9z" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </>
        )}
        {name === "open" && (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </>
        )}
      </svg>
    </span>
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
