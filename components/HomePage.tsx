"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackLink } from "@/components/BackLink";
import { defaultGameSettings, GameSettingsPanel } from "@/components/GameSettingsPanel";
import { HomeDemoBoard } from "@/components/HomeDemoBoard";
import type { GameSettings } from "@/lib/types";

export function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [settings, setSettings] = useState<GameSettings>(() => defaultGameSettings());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async () => {
    if (!name.trim()) {
      setError("Введите имя");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name.trim(), settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      localStorage.setItem(
        `erudit_session_${data.gameId}`,
        JSON.stringify({ playerId: data.playerId, playerName: name.trim() })
      );
      router.push(`/game/${data.gameId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const joinGame = () => {
    if (!name.trim()) {
      setError("Введите имя");
      return;
    }
    const code = gameCode.trim();
    if (!code) {
      setError("Введите код игры");
      return;
    }
    setError(null);
    sessionStorage.setItem("erudit_pending_name", name.trim());
    router.push(`/game/${code}`);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100dvh-73px)] pt-4 pb-8">
      <div className="w-full max-w-md text-center space-y-10">
        <BackLink />
        <div>
          <h1 className="text-[clamp(2.75rem,8vw,3.75rem)] font-bold font-serif text-[var(--color-board)] tracking-tight leading-tight">
            Эрудит
          </h1>
          <p className="text-[var(--color-ink-muted)] mt-3 text-base leading-relaxed">
            Составляйте слова, набирайте очки и играйте с друзьями по одной ссылке
          </p>
        </div>

        <div className="text-left">
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !gameCode.trim() && createGame()}
              placeholder="Ваше имя"
              maxLength={20}
              className="w-full px-4 py-3.5 rounded-xl bg-white text-[var(--color-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-board)]/15 transition-shadow"
            />

            <div className="rounded-2xl bg-white border border-[var(--color-border)] p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-4">Настройки игры</h2>
              <GameSettingsPanel settings={settings} onChange={setSettings} />
            </div>

            <button
              type="button"
              onClick={createGame}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[var(--color-board)] text-white font-semibold hover:bg-[var(--color-board-hover)] transition-colors disabled:opacity-40"
            >
              {loading ? "Создание..." : "Создать игру"}
            </button>
          </div>

          <div className="space-y-3 mt-5">
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinGame()}
              placeholder="Код игры (для входа)"
              maxLength={12}
              className="w-full px-4 py-3.5 rounded-xl bg-white text-[var(--color-ink)] font-mono tracking-widest shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] placeholder:tracking-normal placeholder:font-sans placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-board)]/15 transition-shadow"
            />

            <button
              type="button"
              onClick={joinGame}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-white text-[var(--color-board)] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[var(--color-board-light)] transition-colors disabled:opacity-40"
            >
              Присоединиться к игре
            </button>
          </div>

          {error && <p className="text-red-600 text-sm text-center pt-1">{error}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 pt-4">
          <Feature title="По ссылке" desc="Пригласите друзей одной ссылкой" />
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
