import { NextResponse } from "next/server";
import { checkRedisConnection } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkRedisConnection();
  return NextResponse.json(result, {
    status: result.connected ? 200 : 503,
  });
}
