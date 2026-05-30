import { NextResponse } from "next/server";
import { processBotTurns } from "@/lib/bot";
import { createBotGame, createGame, createLocalGame, createOpenGame } from "@/lib/game-logic";
import { loadGame, registerOpenGame, saveGame, updateGame } from "@/lib/store";
import type { CreateGameRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateGameRequest;
    const matchType = body.matchType ?? "friends";

    let state;
    switch (matchType) {
      case "bot":
        if (!body.botDifficulty) {
          return NextResponse.json({ error: "Укажите сложность бота" }, { status: 400 });
        }
        state = createBotGame(body.playerName, body.botDifficulty, body.settings);
        break;
      case "open":
        state = createOpenGame(body.playerName, body.settings);
        await registerOpenGame(state.id);
        break;
      case "local": {
        if (!body.playerNames?.length) {
          return NextResponse.json({ error: "Укажите имена игроков" }, { status: 400 });
        }
        state = createLocalGame(body.playerNames, body.settings);
        break;
      }
      default:
        state = createGame(body.playerName, body.maxPlayers ?? 4, body.settings, "friends");
    }

    await saveGame(state);

    if (matchType === "bot") {
      await processBotTurns(state.id, loadGame, updateGame);
    }

    const response: Record<string, unknown> = {
      gameId: state.id,
      playerId: state.hostId,
    };

    if (matchType === "local") {
      response.players = state.players.map((p) => ({ id: p.id, name: p.name }));
    }

    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка создания игры" },
      { status: 400 }
    );
  }
}
