import { NextResponse } from "next/server";
import { loadGame } from "@/lib/store";
import type { GameState } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");

  const state = await loadGame(id);
  if (!state) {
    return NextResponse.json({ error: "Игра не найдена" }, { status: 404 });
  }

  if (!playerId) {
    return NextResponse.json(sanitizeForLobby(state), { headers: NO_CACHE });
  }

  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return NextResponse.json({ error: "Игрок не найден" }, { status: 403 });
  }

  return NextResponse.json(sanitizeForPlayer(state, playerId), { headers: NO_CACHE });
}

function sanitizeForLobby(state: GameState) {
  return {
    id: state.id,
    status: state.status,
    hostId: state.hostId,
    maxPlayers: state.maxPlayers,
    currentPlayerIndex: state.currentPlayerIndex,
    winnerId: state.winnerId,
    bagCount: state.bag.length,
    moves: state.moves.slice(-5),
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      rackCount: p.rack.length,
      connected: true,
    })),
    board: state.board.map((row) =>
      row.map((cell) => ({
        bonus: cell.bonus,
        tile: cell.tile
          ? {
              letter: cell.tile.isBlank
                ? cell.tile.blankLetter ?? "?"
                : cell.tile.letter,
              isBlank: cell.tile.isBlank,
            }
          : null,
      }))
    ),
  };
}

function sanitizeForPlayer(state: GameState, playerId: string) {
  const me = state.players.find((p) => p.id === playerId)!;
  const isMyTurn =
    state.status === "playing" &&
    state.players[state.currentPlayerIndex]?.id === playerId;

  return {
    ...sanitizeForLobby(state),
    myRack: me.rack,
    isMyTurn,
    isHost: state.hostId === playerId,
  };
}
