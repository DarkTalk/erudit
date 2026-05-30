"use client";

interface PlayerListProps {
  players: {
    id: string;
    name: string;
    score: number;
    rackCount: number;
    connected: boolean;
  }[];
  currentPlayerIndex: number;
  myId?: string;
  status: string;
}

export function PlayerList({ players, currentPlayerIndex, myId, status }: PlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((player, index) => {
        const isCurrent = status === "playing" && index === currentPlayerIndex;
        const isMe = player.id === myId;

        return (
          <div
            key={player.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              isCurrent
                ? "bg-[var(--color-board-light)] border border-[var(--color-board)]"
                : "bg-[var(--color-paper)] border border-[var(--color-border)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  player.connected ? "bg-emerald-600" : "bg-stone-300"
                }`}
              />
              <span className="font-medium text-[var(--color-ink)]">
                {player.name}
                {isMe && <span className="text-[var(--color-board)] text-sm ml-1 font-normal">(вы)</span>}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-[var(--color-ink-muted)]">{player.rackCount} фиш.</span>
              <span className="font-bold text-[var(--color-tile)] tabular-nums">{player.score}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
