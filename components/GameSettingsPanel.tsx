"use client";

import { useEffect, useMemo, useState } from "react";
import { GameBoard } from "@/components/GameBoard";
import { createHomeDemoBoard, createNormalDemoBoard } from "@/lib/demo-board";
import {
  DEFAULT_GAME_SETTINGS,
  DEFAULT_TILE_BAG_SIZE,
  MAX_TILE_BAG_SIZE,
  MIN_TILE_BAG_SIZE,
  type GameMode,
  type GameSettings,
} from "@/lib/types";

interface GameSettingsPanelProps {
  settings: GameSettings;
  onChange?: (settings: GameSettings) => void;
  readOnly?: boolean;
}

export function GameSettingsPanel({ settings, onChange, readOnly }: GameSettingsPanelProps) {
  const disabled = readOnly || !onChange;
  const [tileInput, setTileInput] = useState(String(settings.tileBagSize));

  useEffect(() => {
    setTileInput(String(settings.tileBagSize));
  }, [settings.tileBagSize]);

  const update = (partial: Partial<GameSettings>) => {
    if (!onChange) return;
    onChange({ ...settings, ...partial });
  };

  const commitTileBagSize = () => {
    const value = Number(tileInput);
    if (Number.isNaN(value)) {
      setTileInput(String(settings.tileBagSize));
      return;
    }
    update({
      tileBagSize: Math.min(MAX_TILE_BAG_SIZE, Math.max(MIN_TILE_BAG_SIZE, value)),
    });
  };

  const demoBoard = useMemo(() => {
    return settings.mode === "crossword" ? createHomeDemoBoard() : createNormalDemoBoard();
  }, [settings.mode]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-3">
          Режим игры
        </p>
        <div className="grid grid-cols-2 gap-2">
          <ModeOption
            label="Обычный"
            description="Слова можно стыковать вплотную"
            selected={settings.mode === "normal"}
            disabled={disabled}
            onSelect={() => update({ mode: "normal" })}
          />
          <ModeOption
            label="Кроссворд"
            description="Между параллельными словами — отступ"
            selected={settings.mode === "crossword"}
            disabled={disabled}
            onSelect={() => update({ mode: "crossword" })}
          />
        </div>
        <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-board-light)]/40 p-2">
          <p className="text-xs text-[var(--color-ink-faint)] text-center mb-2">
            Пример доски — {settings.mode === "crossword" ? "кроссворд" : "обычный режим"}
          </p>
          <GameBoard board={demoBoard} pending={[]} interactive={false} compact />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">
          Фишек в мешке
        </label>
        <input
          type="number"
          min={MIN_TILE_BAG_SIZE}
          max={MAX_TILE_BAG_SIZE}
          value={tileInput}
          disabled={disabled}
          onChange={(e) => {
            setTileInput(e.target.value);
            const value = Number(e.target.value);
            if (!Number.isNaN(value)) {
              update({
                tileBagSize: Math.min(MAX_TILE_BAG_SIZE, Math.max(MIN_TILE_BAG_SIZE, value)),
              });
            }
          }}
          onBlur={commitTileBagSize}
          onKeyDown={(e) => e.key === "Enter" && commitTileBagSize()}
          className="mt-2 w-full px-4 py-3 rounded-xl bg-white text-[var(--color-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-2 focus:ring-[var(--color-board)]/15 disabled:opacity-60"
        />
        <p className="mt-1.5 text-xs text-[var(--color-ink-faint)]">
          Стандарт: {DEFAULT_TILE_BAG_SIZE} ({MIN_TILE_BAG_SIZE}–{MAX_TILE_BAG_SIZE})
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-3">
          Начальное слово
        </p>
        <div className="grid grid-cols-2 gap-2">
          <ModeOption
            label="Без"
            description="Первый ход через ★"
            selected={!settings.startingWord}
            disabled={disabled}
            onSelect={() => update({ startingWord: false })}
          />
          <ModeOption
            label="Со словом"
            description="7 букв из словаря по центру"
            selected={settings.startingWord}
            disabled={disabled}
            onSelect={() => update({ startingWord: true })}
          />
        </div>
      </div>
    </div>
  );
}

function ModeOption({
  label,
  description,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`text-left px-3 py-3 rounded-xl border transition-colors disabled:cursor-default ${
        selected
          ? "border-[var(--color-board)] bg-[var(--color-board-light)]"
          : "border-[var(--color-border)] bg-white hover:border-[var(--color-board)]/40 disabled:hover:border-[var(--color-border)]"
      }`}
    >
      <p className="font-semibold text-sm text-[var(--color-ink)]">{label}</p>
      <p className="text-xs text-[var(--color-ink-faint)] mt-1 leading-snug">{description}</p>
    </button>
  );
}

export function defaultGameSettings(): GameSettings {
  return { ...DEFAULT_GAME_SETTINGS };
}

export function formatGameMode(mode: GameMode): string {
  return mode === "crossword" ? "Кроссворд" : "Обычный";
}
