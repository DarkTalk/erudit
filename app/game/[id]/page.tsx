"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GameView } from "@/components/GameView";
import { useGame } from "@/hooks/useGame";
import { loadSession, saveSession } from "@/lib/session";

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { state, error, loading, join, start, place, exchange, pass } = useGame(
    gameId,
    playerId
  );

  useEffect(() => {
    const session = loadSession(gameId);
    if (session) {
      setPlayerId(session.playerId);
      setJoinName(session.playerName);
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
          <div className="w-10 h-10 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
          <p className="text-white/50">Загрузка игры...</p>
        </div>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 text-lg">{error}</p>
          <a href="/" className="text-violet-400 hover:underline mt-4 inline-block">
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
            <p className="text-white/50 text-sm">Присоединиться к игре</p>
            <p className="text-2xl font-bold text-white font-mono tracking-widest mt-1">
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
            className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-400/50 text-center text-lg"
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {joining ? "Подключение..." : "Войти в игру"}
          </button>
          {joinError && <p className="text-red-400 text-sm text-center">{joinError}</p>}
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
      onStart={start}
    />
  );
}
