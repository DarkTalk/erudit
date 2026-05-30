"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatGameMode, GameSettingsPanel } from "./GameSettingsPanel";
import { GameBoard } from "./GameBoard";
import { LetterPicker } from "./LetterPicker";
import { PlayerList } from "./PlayerList";
import { TileRack } from "./TileRack";
import { VictoryFireworks } from "./VictoryFireworks";
import type { GameViewState } from "@/hooks/useGame";
import { DEFAULT_GAME_SETTINGS, type GameSettings } from "@/lib/types";

interface PendingPlacement {
  row: number;
  col: number;
  tileId: string;
  letter: string;
  isBlank?: boolean;
}

interface GameViewProps {
  state: GameViewState;
  playerId: string;
  onPlace: (
    placements: { row: number; col: number; tileId: string }[],
    blankLetters: Record<string, string>
  ) => Promise<void>;
  onExchange: (tileIds: string[]) => Promise<void>;
  onPass: () => Promise<void>;
  onSurrender: () => Promise<void>;
  onStart: () => Promise<void>;
  onUpdateSettings?: (settings: GameSettings) => Promise<void>;
}

export function GameView({
  state,
  playerId,
  onPlace,
  onExchange,
  onPass,
  onSurrender,
  onStart,
  onUpdateSettings,
}: GameViewProps) {
  const [pending, setPending] = useState<PendingPlacement[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [selectedExchange, setSelectedExchange] = useState<Set<string>>(new Set());
  const [exchangeMode, setExchangeMode] = useState(false);
  const [blankPicker, setBlankPicker] = useState<{ tileId: string; row: number; col: number } | null>(null);
  const [blankLetters, setBlankLetters] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [surrenderStep, setSurrenderStep] = useState<0 | 1>(0);

  useEffect(() => {
    if (!state.isMyTurn) {
      setSurrenderStep(0);
      setExchangeMode(false);
      setSelectedExchange(new Set());
    }
  }, [state.isMyTurn]);

  const myRack = state.myRack ?? [];
  const pendingIds = new Set(pending.map((p) => p.tileId));
  const availableRack = myRack.filter((t) => !pendingIds.has(t.id) && !t.hidden);

  const getTile = useCallback(
    (tileId: string) => myRack.find((t) => t.id === tileId),
    [myRack]
  );

  const returnToRack = useCallback((tileId: string) => {
    const existing = pending.find((p) => p.tileId === tileId);
    if (!existing) return;

    setPending((p) => p.filter((x) => x.tileId !== tileId));
    if (existing.isBlank) {
      setBlankLetters((prev) => {
        const next = { ...prev };
        delete next[tileId];
        return next;
      });
    }
    setSelectedTileId((prev) => (prev === tileId ? null : prev));
  }, [pending]);

  const placeTile = useCallback(
    (row: number, col: number, tileId: string) => {
      if (!state.isMyTurn) return;
      if (state.board[row][col].tile) return;

      const existingAtCell = pending.find((p) => p.row === row && p.col === col);
      if (existingAtCell) {
        if (existingAtCell.tileId === tileId) return;
        return;
      }

      const existingById = pending.find((p) => p.tileId === tileId);
      if (existingById) {
        setPending((p) =>
          p.map((x) => (x.tileId === tileId ? { ...x, row, col } : x))
        );
        setSelectedTileId(null);
        return;
      }

      const tile = getTile(tileId);
      if (!tile || tile.hidden) return;

      if (tile.isBlank && !blankLetters[tileId]) {
        setBlankPicker({ tileId, row, col });
        return;
      }

      setPending((p) => [
        ...p,
        {
          row,
          col,
          tileId,
          letter: tile.isBlank ? blankLetters[tileId] : tile.letter!,
          isBlank: tile.isBlank,
        },
      ]);
      setSelectedTileId(null);
    },
    [state.isMyTurn, state.board, pending, getTile, blankLetters]
  );

  const handleCellClick = (row: number, col: number) => {
    if (exchangeMode) return;
    if (selectedTileId) placeTile(row, col, selectedTileId);
  };

  const handleDrop = (row: number, col: number, tileId: string) => {
    placeTile(row, col, tileId);
  };

  const handleRackDrop = (tileId: string) => {
    if (pending.some((p) => p.tileId === tileId)) {
      returnToRack(tileId);
    }
  };

  const handlePendingDragStart = (tileId: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData("tileId", tileId);
  };

  const handleTileClick = (tileId: string) => {
    if (exchangeMode) {
      setSelectedExchange((prev) => {
        const next = new Set(prev);
        if (next.has(tileId)) next.delete(tileId);
        else next.add(tileId);
        return next;
      });
      return;
    }
    setSelectedTileId((prev) => (prev === tileId ? null : tileId));
  };

  const handleBlankSelect = (letter: string) => {
    if (!blankPicker) return;
    setBlankLetters((prev) => ({ ...prev, [blankPicker.tileId]: letter }));
    setPending((p) => [
      ...p,
      {
        row: blankPicker.row,
        col: blankPicker.col,
        tileId: blankPicker.tileId,
        letter,
        isBlank: true,
      },
    ]);
    setBlankPicker(null);
    setSelectedTileId(null);
  };

  const clearPending = () => {
    setPending([]);
    setBlankLetters({});
    setSelectedTileId(null);
  };

  const undoLast = () => {
    const last = pending[pending.length - 1];
    if (last?.isBlank) {
      setBlankLetters((prev) => {
        const next = { ...prev };
        delete next[last.tileId];
        return next;
      });
    }
    setPending((p) => p.slice(0, -1));
  };

  const submitMove = async () => {
    setActionError(null);
    setSubmitting(true);
    try {
      await onPlace(
        pending.map(({ row, col, tileId }) => ({ row, col, tileId })),
        blankLetters
      );
      clearPending();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  const submitExchange = async () => {
    if (selectedExchange.size === 0) return;
    setActionError(null);
    setSubmitting(true);
    try {
      await onExchange([...selectedExchange]);
      setExchangeMode(false);
      setSelectedExchange(new Set());
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPass = async () => {
    setActionError(null);
    setSubmitting(true);
    try {
      await onPass();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  const submitSurrender = async () => {
    setActionError(null);
    setSubmitting(true);
    try {
      await onSurrender();
      setSurrenderStep(0);
      setExchangeMode(false);
      setSelectedExchange(new Set());
      clearPending();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
  };

  const lastMove = state.moves[state.moves.length - 1];
  const winner = state.winnerId
    ? state.players.find((p) => p.id === state.winnerId)
    : null;
  const isFinished = state.status === "finished";
  const isWinner = isFinished && state.winnerId === playerId;
  const isLoser = isFinished && state.winnerId !== null && state.winnerId !== playerId;

  if (state.status === "waiting") {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <LobbyCard
          gameId={state.id}
          hostId={state.hostId}
          onCopyLink={copyLink}
          linkCopied={linkCopied}
          players={state.players}
          maxPlayers={state.maxPlayers}
          settings={state.settings ?? DEFAULT_GAME_SETTINGS}
          isHost={state.isHost}
          onUpdateSettings={state.isHost ? onUpdateSettings : undefined}
          onStart={async () => {
            setSubmitting(true);
            try {
              await onStart();
            } catch (e) {
              setActionError(e instanceof Error ? e.message : "Ошибка");
            } finally {
              setSubmitting(false);
            }
          }}
          submitting={submitting}
          error={actionError}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
      {isWinner && <VictoryFireworks />}
      <div className="flex-1 flex flex-col items-center gap-4">
        <GameBoard
          board={state.board}
          pending={pending}
          onCellClick={handleCellClick}
          onDrop={handleDrop}
          onPendingDragStart={handlePendingDragStart}
          onPendingClick={returnToRack}
          interactive={!!state.isMyTurn && !exchangeMode}
        />

        {state.status === "playing" && (
          <>
            <TileRack
              tiles={availableRack as { id: string; letter?: string; isBlank?: boolean }[]}
              selectedIds={
                exchangeMode
                  ? selectedExchange
                  : selectedTileId
                    ? new Set([selectedTileId])
                    : new Set()
              }
              exchangeMode={exchangeMode}
              onTileClick={handleTileClick}
              onTileDragStart={(id) => (e) => {
                e.dataTransfer.setData("tileId", id);
              }}
              onDrop={handleRackDrop}
              interactive={!!state.isMyTurn}
            />
            {!state.isMyTurn && (
              <div className="text-center text-[var(--color-ink-muted)] py-1">
                Ход игрока {state.players[state.currentPlayerIndex]?.name}...
              </div>
            )}
          </>
        )}

        {isFinished && winner && (
          <div
            className={`text-center p-6 rounded-2xl border shadow-sm relative z-50 w-full max-w-sm ${
              isWinner
                ? "bg-gradient-to-b from-[#fff8ef] to-[var(--color-board-light)] border-[var(--color-board)] animate-victory-pop"
                : "bg-[var(--color-board-light)] border-[var(--color-border)]"
            }`}
          >
            <p className="text-2xl font-bold text-[var(--color-board)]">
              {isWinner ? "Победа!" : isLoser ? "Поражение" : "Игра окончена"}
            </p>
            <p className="text-[var(--color-ink-muted)] mt-2">
              {isWinner ? (
                <>Вы набрали <span className="font-semibold text-[var(--color-ink)]">{winner.score}</span> очков</>
              ) : (
                <>
                  Победитель:{" "}
                  <span className="font-semibold text-[var(--color-ink)]">{winner.name}</span> ({winner.score}{" "}
                  очков)
                </>
              )}
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex w-full items-center justify-center px-5 py-3 rounded-xl bg-[var(--color-board)] text-white font-semibold hover:bg-[var(--color-board-hover)] transition-colors"
            >
              Играть снова
            </Link>
          </div>
        )}

        {state.isMyTurn && state.status === "playing" && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {!exchangeMode ? (
              <>
                <ActionButton onClick={submitMove} disabled={pending.length === 0 || submitting} primary>
                  Подтвердить
                </ActionButton>
                <ActionButton onClick={undoLast} disabled={pending.length === 0}>
                  Отменить
                </ActionButton>
                <ActionButton onClick={clearPending} disabled={pending.length === 0}>
                  Сбросить
                </ActionButton>
                <ActionButton
                  onClick={() => { setExchangeMode(true); clearPending(); }}
                  disabled={state.bagCount < 1}
                >
                  Обмен
                </ActionButton>
                <ActionButton onClick={submitPass} disabled={submitting}>
                  Пропуск
                </ActionButton>
              </>
            ) : (
              <>
                <ActionButton onClick={submitExchange} disabled={selectedExchange.size === 0 || submitting} primary>
                  Обменять ({selectedExchange.size})
                </ActionButton>
                <ActionButton onClick={() => { setExchangeMode(false); setSelectedExchange(new Set()); }}>
                  Отмена
                </ActionButton>
              </>
            )}
          </div>
        )}

        {state.status === "playing" && (
          <div className="flex flex-col items-center gap-2 w-full">
            {surrenderStep === 0 ? (
              <ActionButton
                onClick={() => setSurrenderStep(1)}
                disabled={submitting}
                className="!text-red-700 !border-red-200 hover:!border-red-400"
              >
                Сдаться
              </ActionButton>
            ) : (
              <div className="flex flex-col items-center gap-2 w-full max-w-sm">
                <p className="text-xs text-red-700/90 text-center">
                  Вы уверены? Игра завершится, победит соперник с наибольшим счётом.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <ActionButton
                    onClick={submitSurrender}
                    disabled={submitting}
                    className="!bg-red-600 hover:!bg-red-700 !text-white !border-red-600"
                  >
                    Да, сдаться
                  </ActionButton>
                  <ActionButton onClick={() => setSurrenderStep(0)} disabled={submitting}>
                    Отмена
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        )}

        {actionError && (
          <p className="text-red-600 text-sm text-center">{actionError}</p>
        )}
      </div>

      <aside className="lg:w-72 space-y-4">
        <div className="rounded-2xl bg-white border border-[var(--color-border)] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-3">
            Игроки
          </h2>
          <PlayerList
            players={state.players}
            currentPlayerIndex={state.currentPlayerIndex}
            myId={playerId}
            hostId={state.hostId}
            status={state.status}
          />
        </div>

        <div className="rounded-2xl bg-white border border-[var(--color-border)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-[var(--color-ink-muted)] mb-2">
            <span>В мешке</span>
            <span className="text-[var(--color-ink)] font-medium">{state.bagCount} фиш.</span>
          </div>
          <div className="text-xs text-[var(--color-ink-faint)] space-y-1 mb-2">
            <p>Режим: {formatGameMode((state.settings ?? DEFAULT_GAME_SETTINGS).mode)}</p>
            {state.initialWord && (
              <p>Начальное слово: {state.initialWord}</p>
            )}
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="w-full mt-2 py-2 rounded-xl text-sm border border-[var(--color-border)] hover:border-[var(--color-board)] hover:bg-[var(--color-board-light)] text-[var(--color-ink-muted)] transition-colors"
          >
            {linkCopied ? "Ссылка скопирована" : "Копировать ссылку"}
          </button>
        </div>

        {lastMove && (
          <div className="rounded-2xl bg-white border border-[var(--color-border)] p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
              Последний ход
            </h2>
            <p className="text-[var(--color-ink)] text-sm">
              {state.players.find((p) => p.id === lastMove.playerId)?.name}
              {lastMove.type === "place" && lastMove.words && (
                <> — {lastMove.words.join(", ")} (+{lastMove.score})</>
              )}
              {lastMove.type === "pass" && " — пропуск"}
              {lastMove.type === "exchange" && " — обмен фишек"}
              {lastMove.type === "surrender" && " — сдача"}
            </p>
          </div>
        )}
      </aside>

      {blankPicker && (
        <LetterPicker
          onSelect={handleBlankSelect}
          onCancel={() => setBlankPicker(null)}
        />
      )}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        primary
          ? "bg-[var(--color-board)] hover:bg-[var(--color-board-hover)] text-white disabled:opacity-40"
          : "bg-white border border-[var(--color-border)] hover:border-[var(--color-board)] text-[var(--color-ink)] disabled:opacity-40"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function LobbyCard({
  gameId,
  hostId,
  onCopyLink,
  linkCopied,
  players,
  maxPlayers,
  settings,
  isHost,
  onUpdateSettings,
  onStart,
  submitting,
  error,
}: {
  gameId: string;
  hostId: string;
  onCopyLink: () => void;
  linkCopied: boolean;
  players: GameViewState["players"];
  maxPlayers: number;
  settings: GameSettings;
  isHost?: boolean;
  onUpdateSettings?: (settings: GameSettings) => Promise<void>;
  onStart: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleSettingsChange = (next: GameSettings) => {
    setLocalSettings(next);
    if (!onUpdateSettings) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSettingsSaving(true);
      setSettingsError(null);
      try {
        await onUpdateSettings(next);
      } catch (e) {
        setSettingsError(e instanceof Error ? e.message : "Ошибка");
        setLocalSettings(settings);
      } finally {
        setSettingsSaving(false);
      }
    }, 400);
  };

  return (
    <div className="rounded-2xl bg-white border border-[var(--color-border)] p-6 space-y-6 shadow-sm">
      <div className="text-center">
        <p className="text-[var(--color-ink-muted)] text-sm">Комната</p>
        <p className="text-3xl font-bold text-[var(--color-ink)] tracking-widest font-mono mt-1">{gameId}</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-3">
          Игроки ({players.length}/{maxPlayers})
        </h2>
        <PlayerList
          players={players}
          currentPlayerIndex={0}
          status="waiting"
          hostId={hostId}
        />
      </div>

      <div className="rounded-xl border border-[var(--color-border)] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">
            Настройки игры
          </h2>
          {settingsSaving && (
            <span className="text-xs text-[var(--color-ink-faint)]">Сохранение...</span>
          )}
        </div>
        {!isHost && (
          <p className="text-sm text-[var(--color-ink-faint)] mb-4">
            Менять настройки может создатель комнаты
          </p>
        )}
        <GameSettingsPanel
          settings={localSettings}
          onChange={isHost ? handleSettingsChange : undefined}
          readOnly={!isHost}
        />
        {settingsError && (
          <p className="text-red-600 text-sm text-center mt-3">{settingsError}</p>
        )}
      </div>

      <div className="space-y-1">
        <button
          type="button"
          onClick={onCopyLink}
          className={`w-full py-3 rounded-xl border font-medium transition-colors ${
            linkCopied
              ? "bg-[var(--color-board-light)] border-[var(--color-board)] text-[var(--color-board)]"
              : "bg-white border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-board)] hover:bg-[var(--color-board-light)]"
          }`}
        >
          {linkCopied
            ? "Пригласить друзей — ссылка скопирована"
            : "Пригласить друзей — скопировать ссылку"}
        </button>
        {linkCopied && (
          <button
            type="button"
            onClick={onCopyLink}
            className="w-full text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-board)] transition-colors py-1"
          >
            скопировать ещё раз
          </button>
        )}

        {isHost && (
          <button
            type="button"
            onClick={onStart}
            disabled={players.length < 2 || submitting}
            className="w-full py-3 rounded-xl bg-[var(--color-board)] text-white font-semibold hover:bg-[var(--color-board-hover)] transition-colors disabled:opacity-40 mt-2"
          >
            {submitting ? "Запуск..." : "Начать игру"}
          </button>
        )}

        {!isHost && (
          <p className="text-center text-[var(--color-ink-faint)] text-sm pt-2">Ожидание начала игры...</p>
        )}
      </div>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
    </div>
  );
}
