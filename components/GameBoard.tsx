"use client";

import clsx from "clsx";
import { useRef } from "react";
import { bonusColor, bonusLabel, bonusLabelColor } from "@/lib/board";
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
  onPendingDragStart?: (tileId: string) => (e: React.DragEvent) => void;
  onPendingClick?: (tileId: string) => void;
  interactive?: boolean;
}

function rectOverlap(
  a: { left: number; top: number; right: number; bottom: number },
  b: DOMRect
): number {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right);
  const bottom = Math.min(a.bottom, b.bottom);
  if (right <= left || bottom <= top) return 0;
  return (right - left) * (bottom - top);
}

function resolveCellFromDrop(
  grid: HTMLDivElement,
  clientX: number,
  clientY: number
): { row: number; col: number } | null {
  const cells = grid.querySelectorAll<HTMLElement>("[data-cell-row]");
  if (cells.length === 0) return null;

  const sample = cells[0]!.getBoundingClientRect();
  const tileRect = {
    left: clientX - sample.width / 2,
    top: clientY - sample.height / 2,
    right: clientX + sample.width / 2,
    bottom: clientY + sample.height / 2,
  };

  let best: { row: number; col: number } | null = null;
  let bestArea = 0;

  for (const cell of cells) {
    const row = Number(cell.dataset.cellRow);
    const col = Number(cell.dataset.cellCol);
    const area = rectOverlap(tileRect, cell.getBoundingClientRect());
    if (area > bestArea) {
      bestArea = area;
      best = { row, col };
    }
  }

  return best;
}

export function GameBoard({
  board,
  pending,
  onCellClick,
  onDrop,
  onPendingDragStart,
  onPendingClick,
  interactive,
}: GameBoardProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const pendingMap = new Map(pending.map((p) => [`${p.row},${p.col}`, p]));

  const handleGridDragOver = (e: React.DragEvent) => {
    if (!interactive || !onDrop) return;
    e.preventDefault();
  };

  const handleGridDrop = (e: React.DragEvent) => {
    if (!interactive || !onDrop || !gridRef.current) return;
    e.preventDefault();
    const tileId = e.dataTransfer.getData("tileId");
    if (!tileId) return;
    const cell = resolveCellFromDrop(gridRef.current, e.clientX, e.clientY);
    if (cell) onDrop(cell.row, cell.col, tileId);
  };

  return (
    <div
      className={clsx(
        "inline-block p-3 sm:p-4 rounded-[12px]",
        "bg-[#f5f0e8] border border-[#ddd0bb]",
        "shadow-[0_4px_24px_rgba(44,36,24,0.06)]",
        "board-linen"
      )}
    >
      <div
        ref={gridRef}
        onDragOver={handleGridDragOver}
        onDrop={handleGridDrop}
        className="relative z-[2] grid gap-[3px]"
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
            const isEmpty = !hasTile;

            return (
              <div
                key={key}
                data-cell-row={ri}
                data-cell-col={ci}
                onClick={() => interactive && onCellClick?.(ri, ci)}
                className={clsx(
                  "relative flex items-center justify-center rounded-[2px] aspect-square",
                  "w-[clamp(18px,4.5vw,36px)] h-[clamp(18px,4.5vw,36px)]",
                  isEmpty && "border border-[#ddd5c5]",
                  isEmpty && bonusColor(bonus),
                  interactive && isEmpty && "cursor-pointer hover:brightness-[1.03]",
                  pendingTile && "ring-2 ring-[#9a5a3a]/35 ring-offset-1 ring-offset-[#f5f0e8]"
                )}
              >
                {isEmpty && bonus && (
                  <span
                    className={clsx(
                      "text-[9px] font-medium text-center leading-none pointer-events-none opacity-75",
                      bonusLabelColor(bonus)
                    )}
                  >
                    {bonusLabel(bonus)}
                  </span>
                )}
                {isEmpty && isCenter && !bonus && (
                  <span className="text-[#9a5a3a]/50 text-[10px] leading-none">★</span>
                )}
                {cell.tile && (
                  <Tile
                    letter={cell.tile.letter}
                    isBlank={cell.tile.isBlank}
                    size="sm"
                    variant="board"
                    disabled
                    className="!w-full !h-full !min-w-0 !min-h-0"
                  />
                )}
                {pendingTile && !cell.tile && (
                  <div
                    className="w-full h-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tile
                      letter={pendingTile.letter}
                      isBlank={pendingTile.isBlank}
                      size="sm"
                      variant="board"
                      selected
                      draggable={interactive}
                      onDragStart={onPendingDragStart?.(pendingTile.tileId)}
                      onClick={
                        interactive
                          ? () => onPendingClick?.(pendingTile.tileId)
                          : undefined
                      }
                      className={clsx(
                        "!w-full !h-full !min-w-0 !min-h-0",
                        interactive && "!cursor-grab active:!cursor-grabbing"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
