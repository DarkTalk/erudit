import { Redis } from "@upstash/redis";
import { DEFAULT_GAME_SETTINGS, type GameState, type OpenGameSummary } from "./types";

const GAME_PREFIX = "game:";
const OPEN_GAMES_KEY = "open_games";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const globalStore = globalThis as typeof globalThis & {
  __eruditMemoryStore?: Map<string, GameState>;
  __eruditOpenGames?: Set<string>;
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

function getRedisCredentials(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

function getRedis(): Redis | null {
  const creds = getRedisCredentials();
  if (!creds) return null;

  if (!globalStore.__eruditRedis) {
    globalStore.__eruditRedis = new Redis(creds);
  }
  return globalStore.__eruditRedis;
}

function getOpenGamesSet(): Set<string> {
  if (!globalStore.__eruditOpenGames) {
    globalStore.__eruditOpenGames = new Set();
  }
  return globalStore.__eruditOpenGames;
}

function parseGameState(data: unknown): GameState | null {
  if (!data) return null;
  const raw =
    typeof data === "string" ? (JSON.parse(data) as GameState) : (data as GameState);
  return {
    ...raw,
    matchType: raw.matchType ?? "friends",
    settings: raw.settings ?? DEFAULT_GAME_SETTINGS,
  };
}

export async function registerOpenGame(gameId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    getOpenGamesSet().add(gameId);
    return;
  }
  await redis.sadd(OPEN_GAMES_KEY, gameId);
}

export async function unregisterOpenGame(gameId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    getOpenGamesSet().delete(gameId);
    return;
  }
  await redis.srem(OPEN_GAMES_KEY, gameId);
}

export async function listOpenGames(): Promise<OpenGameSummary[]> {
  const redis = getRedis();
  let ids: string[];

  if (!redis) {
    ids = [...getOpenGamesSet()];
  } else {
    ids = (await redis.smembers(OPEN_GAMES_KEY)) as string[];
  }

  const games: OpenGameSummary[] = [];
  for (const id of ids) {
    const state = await loadGame(id);
    if (!state || !state.isPublic || state.status !== "waiting") {
      if (state && state.status !== "waiting") {
        await unregisterOpenGame(id);
      }
      continue;
    }
    const host = state.players.find((p) => p.id === state.hostId);
    games.push({
      id: state.id,
      hostName: host?.name ?? "Игрок",
      playerCount: state.players.length,
      maxPlayers: state.maxPlayers,
      createdAt: state.createdAt,
    });
  }

  return games.sort((a, b) => b.createdAt - a.createdAt);
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
  return !!getRedisCredentials();
}

export async function checkRedisConnection(): Promise<{
  connected: boolean;
  mode: "redis" | "memory";
  error?: string;
}> {
  const creds = getRedisCredentials();
  if (!creds) {
    return { connected: false, mode: "memory" };
  }

  try {
    const redis = getRedis()!;
    const pong = await redis.ping();
    return {
      connected: pong === "PONG",
      mode: "redis",
    };
  } catch (e) {
    return {
      connected: false,
      mode: "redis",
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
