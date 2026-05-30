"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackLink } from "@/components/BackLink";
import { defaultGameSettings, GameSettingsPanel } from "@/components/GameSettingsPanel";
import { saveLocalSession } from "@/lib/session";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/types";

type Step = "count" | "setup";

export function LocalGamePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("count");
  const [playerCount, setPlayerCount] = useState(MIN_PLAYERS);
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: MAX_PLAYERS }, (_, i) => `Игрок ${i + 1}`)
  );
  const [settings, setSettings] = useState(defaultGameSettings());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectCount = (count: number) => {
    setPlayerCount(count);
    setStep("setup");
    setError(null);
  };

  const updateName = (index: number, value: string) => {
    setNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const startGame = async () => {
    const playerNames = names.slice(0, playerCount).map((n, i) => n.trim() || `Игрок ${i + 1}`);
    if (playerNames.some((n) => !n.trim())) {
      setError("Введите имена всех игроков");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchType: "local",
          playerNames,
          settings,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");

      saveLocalSession(data.gameId, data.players);
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
            За одним устройством
          </h1>
          <p className="text-[var(--color-ink-muted)] mt-2 text-sm">
            {step === "count"
              ? "Выберите количество игроков"
              : "Введите имена и настройте игру"}
          </p>
        </div>

        {step === "count" ? (
          <div className="space-y-3">
            {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => {
              const count = MIN_PLAYERS + i;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => selectCount(count)}
                  className="w-full text-left px-5 py-4 rounded-xl border border-[var(--color-border)] bg-white hover:border-[var(--color-board)] hover:bg-[var(--color-board-light)] transition-all"
                >
                  <p className="font-semibold text-[var(--color-ink)]">
                    {count} игрока
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    Ходы по очереди на одном экране
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <button
              type="button"
              onClick={() => setStep("count")}
              className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-board)] transition-colors"
            >
              ← Изменить количество ({playerCount} игрока)
            </button>

            <div className="space-y-3">
              {Array.from({ length: playerCount }, (_, i) => (
                <input
                  key={i}
                  type="text"
                  value={names[i]}
                  onChange={(e) => updateName(i, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && i === playerCount - 1 && startGame()}
                  placeholder={`Игрок ${i + 1}`}
                  maxLength={20}
                  className="w-full px-4 py-3.5 rounded-xl bg-white text-[var(--color-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-board)]/15 transition-shadow"
                />
              ))}
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
        )}
      </div>
    </div>
  );
}
