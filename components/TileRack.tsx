"use client";

import clsx from "clsx";
import { Tile } from "./Tile";

interface RackTile {
  id: string;
  letter?: string;
  isBlank?: boolean;
  hidden?: boolean;
}

interface TileRackProps {
  tiles: RackTile[];
  selectedIds: Set<string>;
  exchangeMode: boolean;
  onTileClick: (id: string) => void;
  onTileDragStart: (id: string) => (e: React.DragEvent) => void;
  interactive?: boolean;
}

export function TileRack({
  tiles,
  selectedIds,
  exchangeMode,
  onTileClick,
  onTileDragStart,
  interactive,
}: TileRackProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-amber-900/40 to-amber-950/60 border border-amber-700/30 shadow-inner min-h-[60px]">
      {tiles.length === 0 ? (
        <span className="text-amber-200/50 text-sm">Подставка пуста</span>
      ) : (
        tiles.map((tile) =>
          tile.hidden ? (
            <div
              key={tile.id}
              className="w-10 h-10 rounded-md bg-amber-800/30 border border-amber-700/20"
            />
          ) : (
            <Tile
              key={tile.id}
              letter={tile.letter ?? "?"}
              isBlank={tile.isBlank}
              size="lg"
              selected={selectedIds.has(tile.id)}
              onClick={interactive ? () => onTileClick(tile.id) : undefined}
              draggable={interactive && !exchangeMode}
              onDragStart={onTileDragStart(tile.id)}
              className={clsx(
                exchangeMode && selectedIds.has(tile.id) && "ring-2 ring-orange-400"
              )}
            />
          )
        )
      )}
    </div>
  );
}
