const SESSION_PREFIX = "erudit_session_";

export function saveSession(gameId: string, playerId: string, playerName: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${SESSION_PREFIX}${gameId}`, JSON.stringify({ playerId, playerName }));
}

export function loadSession(gameId: string): { playerId: string; playerName: string } | null {
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
