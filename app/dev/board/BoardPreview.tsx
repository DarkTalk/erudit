"use client";

import { useMemo, useState } from "react";
import { GameBoard } from "@/components/GameBoard";
import { TileRack } from "@/components/TileRack";
import { createEmptyBoard } from "@/lib/board";
import { CENTER } from "@/lib/types";
import type { BoardCell } from "@/lib/types";

const DEMO_RACK = [
  { id: "r1", letter: "а" },
  { id: "r2", letter: "б" },
  { id: "r3", letter: "в" },
  { id: "r4", letter: "г" },
  { id: "r5", letter: "д" },
  { id: "r6", letter: "е" },
  { id: "r7", letter: "?" },
] as const;

/** Sample word «ЭРУДИТ» through the center star for layout preview. */
function createDemoBoard(): BoardCell[][] {
  const board = createEmptyBoard();
  const word = "ЭРУДИТ";
  const startCol = CENTER - Math.floor(word.length / 2);
  for (let i = 0; i < word.length; i++) {
    board[CENTER][startCol + i] = {
      ...board[CENTER][startCol + i],
      tile: { letter: word[i]! },
    };
  }
  return board;
}

export function BoardPreview() {
  const [interactive, setInteractive] = useState(false);
  const [showPending, setShowPending] = useState(true);

  const board = useMemo(() => createDemoBoard(), []);

  const pending = showPending
    ? [{ row: CENTER - 1, col: CENTER, tileId: "p1", letter: "о" }]
    : [];

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="text-center max-w-md space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
          Dev preview
        </p>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Поле и фишки</h1>
        <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
          Локальный предпросмотр без API и без входа в игру. На продакшене эта страница недоступна.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <label className="flex items-center gap-2 cursor-pointer text-[var(--color-ink-muted)]">
          <input
            type="checkbox"
            checked={interactive}
            onChange={(e) => setInteractive(e.target.checked)}
            className="rounded border-[var(--color-border)]"
          />
          Клики по пустым клеткам
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-[var(--color-ink-muted)]">
          <input
            type="checkbox"
            checked={showPending}
            onChange={(e) => setShowPending(e.target.checked)}
            className="rounded border-[var(--color-border)]"
          />
          Фишка «выложена» (pending)
        </label>
      </div>

      <GameBoard
        board={board}
        pending={pending}
        interactive={interactive}
        onCellClick={(row, col) => {
          console.log("cell", row, col);
        }}
      />

      <div className="w-full max-w-xl">
        <p className="text-center text-xs text-[var(--color-ink-faint)] mb-3 font-medium">
          Подставка (анимация появления при загрузке)
        </p>
        <TileRack
          tiles={[...DEMO_RACK]}
          selectedIds={new Set(["r2"])}
          exchangeMode={false}
          onTileClick={(id) => console.log("tile", id)}
          onTileDragStart={() => () => {}}
          interactive
        />
      </div>
    </div>
  );
}
