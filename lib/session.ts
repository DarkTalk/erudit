const SESSION_PREFIX = "erudit_session_";

export interface GameSession {
  playerId: string;
  playerName: string;
  isLocal?: boolean;
  players?: { id: string; name: string }[];
}

export function saveSession(gameId: string, playerId: string, playerName: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${SESSION_PREFIX}${gameId}`, JSON.stringify({ playerId, playerName }));
}

export function saveLocalSession(
  gameId: string,
  players: { id: string; name: string }[]
) {
  if (typeof window === "undefined") return;
  const first = players[0];
  if (!first) return;
  localStorage.setItem(
    `${SESSION_PREFIX}${gameId}`,
    JSON.stringify({
      playerId: first.id,
      playerName: first.name,
      isLocal: true,
      players,
    } satisfies GameSession)
  );
}

export function loadSession(gameId: string): GameSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${SESSION_PREFIX}${gameId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession(gameId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${SESSION_PREFIX}${gameId}`);
}

export function updateSessionPlayerId(gameId: string, playerId: string, playerName: string) {
  if (typeof window === "undefined") return;
  const session = loadSession(gameId);
  if (!session) return;
  localStorage.setItem(
    `${SESSION_PREFIX}${gameId}`,
    JSON.stringify({ ...session, playerId, playerName })
  );
}
