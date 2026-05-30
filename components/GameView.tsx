"use client";

import { useCallback, useState } from "react";
import { GameBoard } from "./GameBoard";
import { LetterPicker } from "./LetterPicker";
import { PlayerList } from "./PlayerList";
import { TileRack } from "./TileRack";
import type { GameViewState } from "@/hooks/useGame";

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
  onStart: () => Promise<void>;
}

export function GameView({
  state,
  playerId,
  onPlace,
  onExchange,
  onPass,
  onStart,
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

  const myRack = state.myRack ?? [];
  const pendingIds = new Set(pending.map((p) => p.tileId));
  const availableRack = myRack.filter((t) => !pendingIds.has(t.id) && !t.hidden);

  const getTile = useCallback(
    (tileId: string) => myRack.find((t) => t.id === tileId),
    [myRack]
  );

  const placeTile = useCallback(
    (row: number, col: number, tileId: string) => {
      if (!state.isMyTurn) return;
      if (state.board[row][col].tile) return;

      const existing = pending.find((p) => p.row === row && p.col === col);
      if (existing) {
        setPending((p) => p.filter((x) => !(x.row === row && x.col === col)));
        if (existing.isBlank) {
          setBlankLetters((prev) => {
            const next = { ...prev };
            delete next[existing.tileId];
            return next;
          });
        }
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

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
  };

  const lastMove = state.moves[state.moves.length - 1];
  const winner = state.winnerId
    ? state.players.find((p) => p.id === state.winnerId)
    : null;

  if (state.status === "waiting") {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <LobbyCard
          gameId={state.id}
          onCopyLink={copyLink}
          linkCopied={linkCopied}
          players={state.players}
          maxPlayers={state.maxPlayers}
          isHost={state.isHost}
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
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      <div className="flex-1 flex flex-col items-center gap-4">
        <GameBoard
          board={state.board}
          pending={pending}
          onCellClick={handleCellClick}
          onDrop={handleDrop}
          interactive={!!state.isMyTurn && !exchangeMode}
        />

        {state.status === "playing" && state.isMyTurn && (
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
            interactive
          />
        )}

        {state.status === "playing" && !state.isMyTurn && (
          <div className="text-center text-[var(--color-ink-muted)] py-4">
            Ход игрока {state.players[state.currentPlayerIndex]?.name}...
          </div>
        )}

        {state.status === "finished" && winner && (
          <div className="text-center p-6 rounded-2xl bg-[var(--color-board-light)] border border-[var(--color-border)]">
            <p className="text-2xl font-bold text-[var(--color-board)]">Игра окончена!</p>
            <p className="text-[var(--color-ink-muted)] mt-2">
              Победитель: <span className="font-semibold text-[var(--color-ink)]">{winner.name}</span> ({winner.score} очков)
            </p>
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
            status={state.status}
          />
        </div>

        <div className="rounded-2xl bg-white border border-[var(--color-border)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-[var(--color-ink-muted)] mb-2">
            <span>В мешке</span>
            <span className="text-[var(--color-ink)] font-medium">{state.bagCount} фиш.</span>
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
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
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
      }`}
    >
      {children}
    </button>
  );
}

function LobbyCard({
  gameId,
  onCopyLink,
  linkCopied,
  players,
  maxPlayers,
  isHost,
  onStart,
  submitting,
  error,
}: {
  gameId: string;
  onCopyLink: () => void;
  linkCopied: boolean;
  players: GameViewState["players"];
  maxPlayers: number;
  isHost?: boolean;
  onStart: () => void;
  submitting: boolean;
  error: string | null;
}) {
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
        />
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
