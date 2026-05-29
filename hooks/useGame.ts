"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface GameViewState {
  id: string;
  status: "waiting" | "playing" | "finished";
  hostId: string;
  maxPlayers: number;
  currentPlayerIndex: number;
  winnerId: string | null;
  bagCount: number;
  isMyTurn?: boolean;
  isHost?: boolean;
  myRack?: { id: string; letter?: string; isBlank?: boolean; hidden?: boolean }[];
  players: {
    id: string;
    name: string;
    score: number;
    rackCount: number;
    connected: boolean;
  }[];
  board: {
    bonus: string | null;
    tile: { letter: string; isBlank?: boolean } | null;
  }[][];
  moves: {
    playerId: string;
    type: string;
    words?: string[];
    score?: number;
    timestamp: number;
  }[];
}

export function useGame(gameId: string, playerId: string | null) {
  const [state, setState] = useState<GameViewState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const versionRef = useRef(0);

  const fetchState = useCallback(async () => {
    try {
      const url = playerId
        ? `/api/games/${gameId}/state?playerId=${playerId}`
        : `/api/games/${gameId}/state`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Ошибка загрузки");
      }
      const data = await res.json();
      setState(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, [gameId, playerId]);

  useEffect(() => {
    fetchState();
    const intervalMs = state?.status === "waiting" ? 1000 : 2000;
    const interval = setInterval(fetchState, intervalMs);
    return () => clearInterval(interval);
  }, [fetchState, state?.status]);

  useEffect(() => {
    if (!playerId || state?.status !== "playing") return;

    const ping = () => {
      fetch(`/api/games/${gameId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "presence", playerId }),
      }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, [gameId, playerId, state?.status]);

  const apiCall = async (url: string, body: Record<string, unknown>) => {
    const v = ++versionRef.current;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Ошибка");
    await fetchState();
    return data;
  };

  const join = async (playerName: string) => {
    return apiCall(`/api/games/${gameId}/join`, { action: "join", playerName });
  };

  const start = async () => {
    if (!playerId) throw new Error("Не авторизован");
    return apiCall(`/api/games/${gameId}/join`, { action: "start", playerId });
  };

  const place = async (
    placements: { row: number; col: number; tileId: string }[],
    blankLetters: Record<string, string>
  ) => {
    if (!playerId) throw new Error("Не авторизован");
    return apiCall(`/api/games/${gameId}/move`, {
      action: "place",
      playerId,
      placements,
      blankLetters,
    });
  };

  const exchange = async (tileIds: string[]) => {
    if (!playerId) throw new Error("Не авторизован");
    return apiCall(`/api/games/${gameId}/move`, {
      action: "exchange",
      playerId,
      tileIds,
    });
  };

  const pass = async () => {
    if (!playerId) throw new Error("Не авторизован");
    return apiCall(`/api/games/${gameId}/move`, { action: "pass", playerId });
  };

  return { state, error, loading, join, start, place, exchange, pass, refresh: fetchState };
}
