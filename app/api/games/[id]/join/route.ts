import { NextResponse } from "next/server";
import { joinGame, startGame } from "@/lib/game-logic";
import { loadGame, updateGame } from "@/lib/store";
import type { JoinGameRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

const JOIN_RETRIES = 5;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

        for (let attempt = 0; attempt < JOIN_RETRIES; attempt++) {
          let playerId = "";
          await updateGame(id, (state) => {
            const result = joinGame(state, playerName);
            playerId = result.playerId;
            return result.state;
          });

          const verify = await loadGame(id);
          if (verify?.players.some((p) => p.id === playerId)) {
            return NextResponse.json({ playerId });
          }

          await sleep(80 * (attempt + 1));
        }

        throw new Error("Не удалось подключиться, попробуйте снова");
      }
      case "start": {
        await updateGame(id, (state) => startGame(state, body.playerId));
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
