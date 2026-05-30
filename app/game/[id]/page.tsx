"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GameView } from "@/components/GameView";
import { useGame } from "@/hooks/useGame";
import { loadSession, saveSession } from "@/lib/session";

const inputClass =
  "w-full px-5 py-4 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-board)] focus:ring-2 focus:ring-[var(--color-board-light)] text-center text-lg";

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { state, error, loading, join, start, updateSettings, place, exchange, pass, surrender } = useGame(
    gameId,
    playerId
  );

  useEffect(() => {
    const session = loadSession(gameId);
    if (session) {
      setPlayerId(session.playerId);
      setJoinName(session.playerName);
    } else {
      const pending = sessionStorage.getItem("erudit_pending_name");
      if (pending) {
        setJoinName(pending);
        sessionStorage.removeItem("erudit_pending_name");
      }
    }
    setInitialized(true);
  }, [gameId]);

  const handleJoin = async () => {
    if (!joinName.trim()) {
      setJoinError("Введите имя");
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const data = await join(joinName.trim());
      setPlayerId(data.playerId);
      saveSession(gameId, data.playerId, joinName.trim());
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setJoining(false);
    }
  };

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--color-board-light)] border-t-[var(--color-board)] rounded-full animate-spin" />
          <p className="text-[var(--color-ink-muted)]">Загрузка игры...</p>
        </div>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <a href="/" className="text-[var(--color-board)] hover:underline mt-4 inline-block">
            На главную
          </a>
        </div>
      </div>
    );
  }

  if (!playerId && state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center mb-6">
            <p className="text-[var(--color-ink-muted)] text-sm">Присоединиться к игре</p>
            <p className="text-2xl font-bold text-[var(--color-ink)] font-mono tracking-widest mt-1">
              {gameId}
            </p>
          </div>
          <input
            type="text"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Ваше имя"
            maxLength={20}
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-4 rounded-xl bg-[var(--color-board)] text-white font-semibold hover:bg-[var(--color-board-hover)] disabled:opacity-50 transition-colors"
          >
            {joining ? "Подключение..." : "Войти в игру"}
          </button>
          {joinError && <p className="text-red-600 text-sm text-center">{joinError}</p>}
        </div>
      </div>
    );
  }

  if (!state || !playerId) return null;

  return (
    <GameView
      state={state}
      playerId={playerId}
      onPlace={place}
      onExchange={exchange}
      onPass={pass}
      onSurrender={surrender}
      onStart={start}
      onUpdateSettings={updateSettings}
    />
  );
}
