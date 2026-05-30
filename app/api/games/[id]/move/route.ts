import { NextResponse } from "next/server";
import { processBotTurns } from "@/lib/bot";
import {
  exchangeTiles,
  passTurn,
  placeTiles,
  surrender,
} from "@/lib/game-logic";
import { loadGame, updateGame } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { action, playerId } = body;

    await updateGame(id, (state) => {
      switch (action) {
        case "place":
          return placeTiles(
            state,
            playerId,
            body.placements,
            body.blankLetters ?? {}
          );
        case "exchange":
          return exchangeTiles(state, playerId, body.tileIds);
        case "pass":
          return passTurn(state, playerId);
        case "surrender":
          return surrender(state, playerId);
        default:
          throw new Error("Неизвестное действие");
      }
    });

    await processBotTurns(id, loadGame, updateGame);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка хода";
    const status = message === "Игра не найдена" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
