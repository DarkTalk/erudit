import {
  BlobPreconditionFailedError,
  del,
  get,
  put,
} from "@vercel/blob";
import type { GameState } from "./types";

const GAME_PREFIX = "games";
const MAX_RETRIES = 8;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPreconditionError(error: unknown): boolean {
  if (error instanceof BlobPreconditionFailedError) return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("precondition failed") || msg.includes("etag mismatch");
  }
  return false;
}

async function readBlobGameWithEtag(
  id: string
): Promise<{ state: GameState; etag: string } | null> {
  const result = await get(gamePath(id), { access: "private" });
  if (!result?.stream) return null;

  const text = await new Response(result.stream).text();
  return {
    state: JSON.parse(text) as GameState,
    etag: result.blob.etag,
  };
}

async function writeBlobGame(state: GameState, etag?: string): Promise<void> {
  await put(gamePath(state.id), JSON.stringify(state), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    ...(etag ? { ifMatch: etag } : {}),
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
  const loaded = await readBlobGameWithEtag(id);
  return loaded?.state ?? null;
}

export async function deleteGame(id: string): Promise<void> {
  if (!hasBlobToken()) {
    getMemoryStore().delete(id);
    return;
  }
  const loaded = await readBlobGameWithEtag(id);
  if (loaded) {
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

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const loaded = await readBlobGameWithEtag(id);
    if (!loaded) throw new Error("Игра не найдена");

    const updated = updater(loaded.state);

    try {
      await writeBlobGame(updated, loaded.etag);
      return updated;
    } catch (error) {
      if (isPreconditionError(error) && attempt < MAX_RETRIES - 1) {
        await sleep(30 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }

  throw new Error("Конфликт обновления, попробуйте снова");
}

export function isPersistentStore(): boolean {
  return hasBlobToken();
}
