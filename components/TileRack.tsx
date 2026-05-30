"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
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

function useRackTileSize(tileCount: number): "sm" | "md" | "lg" {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 480px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return useMemo(() => {
    if (tileCount === 0) return "lg";
    if (narrow) {
      if (tileCount >= 7) return "sm";
      if (tileCount >= 5) return "md";
      return "lg";
    }
    if (tileCount >= 7) return "md";
    return "lg";
  }, [narrow, tileCount]);
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
  const tileSize = useRackTileSize(tiles.length);

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

  const gapClass =
    tileSize === "sm" ? "gap-0.5 sm:gap-1" : tileSize === "md" ? "gap-1 sm:gap-1.5" : "gap-1.5 sm:gap-2";

  const paddingClass =
    tileSize === "sm" ? "p-2 sm:p-3" : tileSize === "md" ? "p-2.5 sm:p-3.5" : "p-3 sm:p-4";

  return (
    <div className="w-full max-w-full px-1">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={clsx(
          "flex items-center justify-center flex-wrap sm:flex-nowrap",
          gapClass,
          paddingClass,
          "rounded-2xl bg-[#efe9df] border border-[#ddd0bb] shadow-[inset_0_2px_8px_rgba(44,36,24,0.04)] min-h-[52px] w-full max-w-full mx-auto",
          onDrop && "transition-colors",
          exchangeMode && "ring-1 ring-[#8a3a58]/30"
        )}
      >
        {tiles.length === 0 ? (
          <span className="text-[var(--color-ink-faint)] text-sm font-medium">Подставка пуста</span>
        ) : (
          tiles.map((tile, index) =>
            tile.hidden ? (
              <div
                key={tile.id}
                className={clsx(
                  "rounded-[4px] bg-[#3d2f1e]/20 border border-[#3d2f1e]/15 shadow-[0_2px_0_rgba(26,16,10,0.15)] animate-rack-tile-in shrink-0",
                  tileSize === "sm" && "w-8 h-8",
                  tileSize === "md" && "w-10 h-10",
                  tileSize === "lg" && "w-12 h-12"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              />
            ) : (
              <div
                key={tile.id}
                className="animate-rack-tile-in shrink-0"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <Tile
                  letter={tile.letter ?? "?"}
                  isBlank={tile.isBlank}
                  size={tileSize}
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
      {exchangeMode && (
        <p className="text-center text-xs text-[#8a3a58] mt-1.5 font-medium">
          Нажмите на фишки, которые хотите обменять
        </p>
      )}
    </div>
  );
}
