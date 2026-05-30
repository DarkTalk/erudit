"use client";

import clsx from "clsx";
import { bonusColor, bonusLabel } from "@/lib/board";
import { BOARD_SIZE, CENTER } from "@/lib/types";
import { Tile } from "./Tile";
import type { BonusType } from "@/lib/types";

interface BoardTile {
  letter: string;
  isBlank?: boolean;
}

interface PendingPlacement {
  row: number;
  col: number;
  tileId: string;
  letter: string;
  isBlank?: boolean;
}

interface GameBoardProps {
  board: { bonus: string | null; tile: BoardTile | null }[][];
  pending: PendingPlacement[];
  onCellClick?: (row: number, col: number) => void;
  onDrop?: (row: number, col: number, tileId: string) => void;
  interactive?: boolean;
}

export function GameBoard({
  board,
  pending,
  onCellClick,
  onDrop,
  interactive,
}: GameBoardProps) {
  const pendingMap = new Map(pending.map((p) => [`${p.row},${p.col}`, p]));

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (row: number, col: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const tileId = e.dataTransfer.getData("tileId");
    if (tileId && onDrop) onDrop(row, col, tileId);
  };

  return (
    <div className="inline-block p-2 rounded-xl bg-[#1a4d32] border border-[#2d5a3d] shadow-lg">
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, ri) =>
          row.map((cell, ci) => {
            const key = `${ri},${ci}`;
            const pendingTile = pendingMap.get(key);
            const hasTile = cell.tile || pendingTile;
            const bonus = cell.bonus as BonusType | null;
            const isCenter = ri === CENTER && ci === CENTER;

            return (
              <div
                key={key}
                onClick={() => interactive && onCellClick?.(ri, ci)}
                onDragOver={handleDragOver}
                onDrop={handleDrop(ri, ci)}
                className={clsx(
                  "relative flex items-center justify-center rounded-sm aspect-square",
                  "w-[clamp(18px,4.5vw,36px)] h-[clamp(18px,4.5vw,36px)]",
                  !hasTile && bonusColor(bonus),
                  !hasTile && "border border-emerald-800/30",
                  interactive && !hasTile && "cursor-pointer hover:brightness-125",
                  pendingTile && "ring-2 ring-amber-300"
                )}
              >
                {!hasTile && bonus && (
                  <span className="text-[6px] sm:text-[8px] font-bold text-white/80 text-center leading-tight pointer-events-none">
                    {bonusLabel(bonus)}
                  </span>
                )}
                {!hasTile && isCenter && !bonus && (
                  <span className="text-amber-300/60 text-xs">★</span>
                )}
                {cell.tile && (
                  <Tile
                    letter={cell.tile.letter}
                    isBlank={cell.tile.isBlank}
                    size="sm"
                    disabled
                    className="!w-full !h-full !text-[clamp(8px,2vw,14px)]"
                  />
                )}
                {pendingTile && !cell.tile && (
                  <Tile
                    letter={pendingTile.letter}
                    isBlank={pendingTile.isBlank}
                    size="sm"
                    selected
                    className="!w-full !h-full !text-[clamp(8px,2vw,14px)]"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
