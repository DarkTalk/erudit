import { processBotTurns } from "./bot";
import { applyTurnTimeout, turnAdvanced } from "./game-logic";
import { loadGame, saveGame, updateGame } from "./store";
import type { GameState } from "./types";

/** Загружает игру, применяет таймаут хода и сохраняет при необходимости */
export async function loadGameResolved(id: string): Promise<GameState | null> {
  let state = await loadGame(id);
  if (!state) return null;

  const afterTimeout = applyTurnTimeout(state);
  if (turnAdvanced(state, afterTimeout)) {
    await saveGame(afterTimeout);
    await processBotTurns(id, loadGame, updateGame);
    state = await loadGame(id);
    if (!state) return null;

    const again = applyTurnTimeout(state);
    if (turnAdvanced(state, again)) {
      await saveGame(again);
      state = await loadGame(id);
    }
  } else if (!state.turnStartedAt && afterTimeout.turnStartedAt) {
    await saveGame(afterTimeout);
    state = afterTimeout;
  }

  return state;
}
