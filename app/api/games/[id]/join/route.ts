import { NextResponse } from "next/server";
import { joinGame, startGame, updatePlayerPresence } from "@/lib/game-logic";
import { updateGame } from "@/lib/store";
import type { JoinGameRequest } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const action = body.action as string;

    switch (action) {
      case "join": {
        const { playerName } = body as JoinGameRequest;
        let playerId = "";
        await updateGame(id, (state) => {
          const result = joinGame(state, playerName);
          playerId = result.playerId;
          return result.state;
        });
        return NextResponse.json({ playerId });
      }
      case "start": {
        await updateGame(id, (state) => startGame(state, body.playerId));
        return NextResponse.json({ ok: true });
      }
      case "presence": {
        await updateGame(id, (state) =>
          updatePlayerPresence(state, body.playerId)
        );
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка";
    const status = message === "Игра не найдена" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
