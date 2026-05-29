import { del, get, put } from "@vercel/blob";
import type { GameState } from "./types";

const GAME_PREFIX = "games";

const globalStore = globalThis as typeof globalThis & {
  __eruditMemoryStore?: Map<string, GameState>;
};

function getMemoryStore(): Map<string, GameState> {
  if (!globalStore.__eruditMemoryStore) {
    globalStore.__eruditMemoryStore = new Map();
  }
  return globalStore.__eruditMemoryStore;
}

function gamePath(id: string): string {
  return `${GAME_PREFIX}/${id}.json`;
}

function hasBlobToken(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function readBlobGame(id: string): Promise<GameState | null> {
  const result = await get(gamePath(id), { access: "private" });
  if (!result?.stream) return null;

  const text = await new Response(result.stream).text();
  return JSON.parse(text) as GameState;
}

async function writeBlobGame(state: GameState): Promise<void> {
  await put(gamePath(state.id), JSON.stringify(state), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export async function saveGame(state: GameState): Promise<void> {
  if (!hasBlobToken()) {
    getMemoryStore().set(state.id, state);
    return;
  }
  await writeBlobGame(state);
}

export async function loadGame(id: string): Promise<GameState | null> {
  if (!hasBlobToken()) {
    return getMemoryStore().get(id) ?? null;
  }
  return readBlobGame(id);
}

export async function deleteGame(id: string): Promise<void> {
  if (!hasBlobToken()) {
    getMemoryStore().delete(id);
    return;
  }
  const state = await readBlobGame(id);
  if (state) {
    await del(gamePath(id));
  }
}

export async function updateGame(
  id: string,
  updater: (state: GameState) => GameState
): Promise<GameState> {
  if (!hasBlobToken()) {
    const current = getMemoryStore().get(id);
    if (!current) throw new Error("Игра не найдена");
    const updated = updater(current);
    getMemoryStore().set(id, updated);
    return updated;
  }

  const current = await readBlobGame(id);
  if (!current) throw new Error("Игра не найдена");

  const updated = updater(current);
  await writeBlobGame(updated);
  return updated;
}

export function isPersistentStore(): boolean {
  return hasBlobToken();
}
