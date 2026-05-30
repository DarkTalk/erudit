import { NextResponse } from "next/server";
import { listOpenGames } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const games = await listOpenGames();
    return NextResponse.json({ games });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка загрузки" },
      { status: 500 }
    );
  }
}
