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
  onDrop?: (tileId: string) => void;
  interactive?: boolean;
}

export function TileRack({
  tiles,
  selectedIds,
  exchangeMode,
  onTileClick,
  onTileDragStart,
  onDrop,
  interactive,
}: TileRackProps) {
  const handleDragOver = (e: React.DragEvent) => {
    if (!onDrop) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!onDrop) return;
    e.preventDefault();
    const tileId = e.dataTransfer.getData("tileId");
    if (tileId) onDrop(tileId);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={clsx(
        "flex items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-2xl bg-[#efe9df] border border-[#ddd0bb] shadow-[inset_0_2px_8px_rgba(44,36,24,0.04)] min-h-[60px]",
        onDrop && "transition-colors"
      )}
    >
      {tiles.length === 0 ? (
        <span className="text-[var(--color-ink-faint)] text-sm font-medium">Подставка пуста</span>
      ) : (
        tiles.map((tile, index) =>
          tile.hidden ? (
            <div
              key={tile.id}
              className="w-12 h-12 rounded-[4px] bg-[#3d2f1e]/20 border border-[#3d2f1e]/15 shadow-[0_2px_0_rgba(26,16,10,0.15)] animate-rack-tile-in"
              style={{ animationDelay: `${index * 30}ms` }}
            />
          ) : (
            <div
              key={tile.id}
              className="animate-rack-tile-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <Tile
                letter={tile.letter ?? "?"}
                isBlank={tile.isBlank}
                size="lg"
                variant="rack"
                selected={selectedIds.has(tile.id)}
                onClick={interactive ? () => onTileClick(tile.id) : undefined}
                draggable={interactive && !exchangeMode}
                onDragStart={onTileDragStart(tile.id)}
                className={clsx(
                  exchangeMode && selectedIds.has(tile.id) && "ring-2 ring-[#8a3a58]"
                )}
              />
            </div>
          )
        )
      )}
    </div>
  );
}
