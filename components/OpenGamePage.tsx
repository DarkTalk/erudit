"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BackLink } from "@/components/BackLink";
import { defaultGameSettings, GameSettingsPanel } from "@/components/GameSettingsPanel";
import type { GameSettings, OpenGameSummary } from "@/lib/types";

export function OpenGamePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [settings, setSettings] = useState<GameSettings>(() => defaultGameSettings());
  const [openGames, setOpenGames] = useState<OpenGameSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpenGames = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/open?_=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки");
      setOpenGames(data.games ?? []);
    } catch {
      setOpenGames([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenGames();
    const interval = setInterval(fetchOpenGames, 3000);
    return () => clearInterval(interval);
  }, [fetchOpenGames]);

  const createRoom = async () => {
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
        body: JSON.stringify({ playerName: name.trim(), matchType: "open", settings }),
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

  const joinRoom = (gameId: string) => {
    if (!name.trim()) {
      setError("Введите имя");
      return;
    }
    setError(null);
    sessionStorage.setItem("erudit_pending_name", name.trim());
    router.push(`/game/${gameId}`);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100dvh-73px)] pt-4 pb-8">
      <div className="w-full max-w-md">
        <BackLink />

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-serif text-[var(--color-board)]">
            Открытая игра
          </h1>
          <p className="text-[var(--color-ink-muted)] mt-2 text-sm">
            Создайте комнату или присоединитесь к ожидающему сопернику
          </p>
        </div>

        <div className="space-y-4 text-left">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            maxLength={20}
            className="w-full px-4 py-3.5 rounded-xl bg-white text-[var(--color-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-board)]/15 transition-shadow"
          />

          <div>
            <h2 className="text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-3">
              Открытые комнаты
            </h2>

            {listLoading ? (
              <p className="text-sm text-[var(--color-ink-faint)] text-center py-4">Загрузка...</p>
            ) : openGames.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-faint)] text-center py-4 rounded-xl border border-dashed border-[var(--color-border)]">
                Пока нет открытых комнат. Создайте свою!
              </p>
            ) : (
              <div className="space-y-2">
                {openGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white border border-[var(--color-border)]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--color-ink)] truncate">
                        {game.hostName}
                      </p>
                      <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                        {game.playerCount}/{game.maxPlayers} игроков · {game.id}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => joinRoom(game.id)}
                      disabled={game.playerCount >= game.maxPlayers}
                      className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-board-light)] text-[var(--color-board)] hover:bg-[var(--color-board)] hover:text-white transition-colors disabled:opacity-40"
                    >
                      Войти
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-3">
              Создать игру
            </h2>

            <div className="space-y-3">
              <div className="rounded-2xl bg-white border border-[var(--color-border)] p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-4">Настройки комнаты</h3>
                <GameSettingsPanel settings={settings} onChange={setSettings} />
              </div>

              <button
                type="button"
                onClick={createRoom}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[var(--color-board)] text-white font-semibold hover:bg-[var(--color-board-hover)] transition-colors disabled:opacity-40"
              >
                {loading ? "Создание..." : "Создать игру"}
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}
