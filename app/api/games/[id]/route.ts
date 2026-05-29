import { NextResponse } from "next/server";
import { loadGame } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const state = await loadGame(id);

  if (!state) {
    return NextResponse.json({ error: "Игра не найдена" }, { status: 404 });
  }

  const sanitized = {
    ...state,
    bag: { count: state.bag.length },
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      rackCount: p.rack.length,
      connected: p.connected,
    })),
  };

  return NextResponse.json(sanitized);
}
