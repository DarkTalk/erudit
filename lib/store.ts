import { Redis } from "@upstash/redis";
import type { GameState } from "./types";

const GAME_PREFIX = "game:";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const globalStore = globalThis as typeof globalThis & {
  __eruditMemoryStore?: Map<string, GameState>;
  __eruditRedis?: Redis | null;
};

function getMemoryStore(): Map<string, GameState> {
  if (!globalStore.__eruditMemoryStore) {
    globalStore.__eruditMemoryStore = new Map();
  }
  return globalStore.__eruditMemoryStore;
}

function gameKey(id: string): string {
  return `${GAME_PREFIX}${id}`;
}

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  if (!globalStore.__eruditRedis) {
    globalStore.__eruditRedis = new Redis({ url, token });
  }
  return globalStore.__eruditRedis;
}

function parseGameState(data: unknown): GameState | null {
  if (!data) return null;
  if (typeof data === "string") {
    return JSON.parse(data) as GameState;
  }
  return data as GameState;
}

export async function saveGame(state: GameState): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    getMemoryStore().set(state.id, state);
    return;
  }
  await redis.set(gameKey(state.id), state, { ex: TTL_SECONDS });
}

export async function loadGame(id: string): Promise<GameState | null> {
  const redis = getRedis();
  if (!redis) {
    return getMemoryStore().get(id) ?? null;
  }
  const data = await redis.get<GameState>(gameKey(id));
  return parseGameState(data);
}

export async function deleteGame(id: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    getMemoryStore().delete(id);
    return;
  }
  await redis.del(gameKey(id));
}

export async function updateGame(
  id: string,
  updater: (state: GameState) => GameState
): Promise<GameState> {
  const redis = getRedis();
  if (!redis) {
    const current = getMemoryStore().get(id);
    if (!current) throw new Error("Игра не найдена");
    const updated = updater(current);
    getMemoryStore().set(id, updated);
    return updated;
  }

  const current = await loadGame(id);
  if (!current) throw new Error("Игра не найдена");

  const updated = updater(current);
  await saveGame(updated);
  return updated;
}

export function isPersistentStore(): boolean {
  return !!getRedis();
}
