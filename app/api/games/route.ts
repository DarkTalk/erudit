import { NextResponse } from "next/server";
import { createGame } from "@/lib/game-logic";
import { saveGame } from "@/lib/store";
import type { CreateGameRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateGameRequest;
    const state = createGame(body.playerName, body.maxPlayers ?? 4, body.settings);
    await saveGame(state);
    return NextResponse.json({
      gameId: state.id,
      playerId: state.hostId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка создания игры" },
      { status: 400 }
    );
  }
}
