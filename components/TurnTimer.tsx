"use client";

import { useEffect, useRef, useState } from "react";
import { formatTurnTime } from "./GameSettingsPanel";

interface TurnTimerProps {
  turnTimeSeconds: number;
  turnStartedAt: number;
  isCurrentTurn: boolean;
  playerName?: string;
  onExpired?: () => void;
}

export function TurnTimer({
  turnTimeSeconds,
  turnStartedAt,
  isCurrentTurn,
  playerName,
  onExpired,
}: TurnTimerProps) {
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, turnTimeSeconds * 1000 - (Date.now() - turnStartedAt))
  );
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
  }, [turnStartedAt, turnTimeSeconds]);

  useEffect(() => {
    const tick = () => {
      const next = Math.max(0, turnTimeSeconds * 1000 - (Date.now() - turnStartedAt));
      setRemainingMs(next);
      if (next === 0 && onExpired && !expiredRef.current) {
        expiredRef.current = true;
        onExpired();
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [turnTimeSeconds, turnStartedAt, onExpired]);

  const totalMs = turnTimeSeconds * 1000;
  const ratio = totalMs > 0 ? remainingMs / totalMs : 0;
  const secondsLeft = Math.ceil(remainingMs / 1000);
  const urgent = ratio <= 0.2;
  const critical = ratio <= 0.08;

  return (
    <div
      className={`rounded-xl border px-4 py-3 transition-colors ${
        critical
          ? "border-red-300 bg-red-50"
          : urgent
            ? "border-amber-300 bg-amber-50"
            : "border-[var(--color-border)] bg-[var(--color-board-light)]/50"
      }`}
      role="timer"
      aria-live="polite"
      aria-label={`Осталось ${secondsLeft} секунд`}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-[var(--color-ink-muted)]">
          {isCurrentTurn ? "Ваш ход" : `Ход: ${playerName ?? "игрок"}`}
        </span>
        <span
          className={`font-mono font-semibold tabular-nums ${
            critical ? "text-red-700" : urgent ? "text-amber-800" : "text-[var(--color-board)]"
          }`}
        >
          {formatTurnTime(secondsLeft)}
        </span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/80 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            critical ? "bg-red-500" : urgent ? "bg-amber-500" : "bg-[var(--color-board)]"
          }`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      {remainingMs === 0 && (
        <p className="mt-2 text-xs text-[var(--color-ink-faint)]">Время вышло — ход переходит дальше</p>
      )}
    </div>
  );
}
