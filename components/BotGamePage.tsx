"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackLink } from "@/components/BackLink";
import { defaultGameSettings, GameSettingsPanel } from "@/components/GameSettingsPanel";
import type { BotDifficulty } from "@/lib/types";

const DIFFICULTIES: { id: BotDifficulty; label: string; hint: string }[] = [
  { id: "easy", label: "Простая", hint: "Случайные ходы, частые пропуски" },
  { id: "medium", label: "Средняя", hint: "Разумные слова, без перфекционизма" },
  { id: "hard", label: "Сложная", hint: "Стремится к максимуму очков" },
];

export function BotGamePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<BotDifficulty>("medium");
  const [settings, setSettings] = useState(defaultGameSettings());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGame = async () => {
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
        body: JSON.stringify({
          playerName: name.trim(),
          matchType: "bot",
          botDifficulty: difficulty,
          settings,
        }),
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

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100dvh-73px)] pt-4 pb-8">
      <div className="w-full max-w-md">
        <BackLink />

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-serif text-[var(--color-board)]">
            Игра против компьютера
          </h1>
          <p className="text-[var(--color-ink-muted)] mt-2 text-sm">
            Выберите сложность и начните партию с ботом
          </p>
        </div>

        <div className="space-y-4 text-left">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startGame()}
            placeholder="Ваше имя"
            maxLength={20}
            className="w-full px-4 py-3.5 rounded-xl bg-white text-[var(--color-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-board)]/15 transition-shadow"
          />

          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">Сложность</p>
            <div className="space-y-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    difficulty === d.id
                      ? "border-[var(--color-board)] bg-[var(--color-board-light)]"
                      : "border-[var(--color-border)] bg-white hover:border-[var(--color-board)]/40"
                  }`}
                >
                  <p className="font-medium text-[var(--color-ink)]">{d.label}</p>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{d.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[var(--color-border)] p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-4">Настройки игры</h2>
            <GameSettingsPanel settings={settings} onChange={setSettings} />
          </div>

          <button
            type="button"
            onClick={startGame}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[var(--color-board)] text-white font-semibold hover:bg-[var(--color-board-hover)] transition-colors disabled:opacity-40"
          >
            {loading ? "Запуск..." : "Начать игру"}
          </button>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}
