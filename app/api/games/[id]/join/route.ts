import { NextResponse } from "next/server";
import { joinGame, startGame, updateGameSettings } from "@/lib/game-logic";
import { unregisterOpenGame, updateGame } from "@/lib/store";
import type { JoinGameRequest, UpdateGameSettingsRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

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
        const normalizedName = playerName.trim().slice(0, 20) || "Игрок";
        let playerId = "";

        await updateGame(id, (state) => {
          const existing = state.players.find((p) => p.name === normalizedName);
          if (existing) {
            playerId = existing.id;
            return {
              ...state,
              players: state.players.map((p) =>
                p.id === existing.id
                  ? { ...p, connected: true, lastSeen: Date.now() }
                  : p
              ),
            };
          }

          const result = joinGame(state, playerName);
          playerId = result.playerId;
          return result.state;
        });

        return NextResponse.json({ playerId });
      }
      case "start": {
        await updateGame(id, (state) => startGame(state, body.playerId));
        await unregisterOpenGame(id);
        return NextResponse.json({ ok: true });
      }
      case "updateSettings": {
        const { playerId, settings } = body as UpdateGameSettingsRequest;
        await updateGame(id, (state) => updateGameSettings(state, playerId, settings));
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
