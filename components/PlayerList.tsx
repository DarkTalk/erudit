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
                ? "bg-violet-500/20 border border-violet-400/40 shadow-lg shadow-violet-500/10"
                : "bg-white/5 border border-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  player.connected ? "bg-emerald-400" : "bg-gray-500"
                }`}
              />
              <span className="font-medium text-white/90">
                {player.name}
                {isMe && <span className="text-violet-300/70 text-sm ml-1">(вы)</span>}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-white/50">{player.rackCount} фиш.</span>
              <span className="font-bold text-amber-300 tabular-nums">{player.score}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
