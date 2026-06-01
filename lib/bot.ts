import { getCandidateWords } from "./dictionary";
import { exchangeTiles, passTurn, placeTiles } from "./game-logic";
import {
  BOARD_SIZE,
  CENTER,
  type BotDifficulty,
  type GameState,
  type PendingPlacement,
  type RackTile,
} from "./types";

interface RackAssignment {
  tileIds: string[];
  blankLetters: Record<string, string>;
}

interface MoveCandidate {
  placements: PendingPlacement[];
  blankLetters: Record<string, string>;
  score: number;
}

function getLetter(tile: { letter: string; isBlank?: boolean; blankLetter?: string }): string {
  if (tile.isBlank && tile.blankLetter) return tile.blankLetter.toLowerCase();
  return tile.letter === "?" ? "" : tile.letter.toLowerCase();
}

function boardHasTiles(state: GameState): boolean {
  return state.board.some((row) => row.some((cell) => cell.tile !== null));
}

function assignRackToWord(rack: RackTile[], word: string): RackAssignment | null {
  const letters = word.toLowerCase().replace(/ё/g, "е").split("");
  const available = [...rack];
  const tileIds: string[] = [];
  const blankLetters: Record<string, string> = {};

  for (const letter of letters) {
    const idx = available.findIndex(
      (t) => !t.isBlank && t.letter.toLowerCase().replace(/ё/g, "е") === letter
    );
    if (idx >= 0) {
      tileIds.push(available[idx]!.id);
      available.splice(idx, 1);
      continue;
    }
    const blankIdx = available.findIndex((t) => t.isBlank);
    if (blankIdx >= 0) {
      const blank = available[blankIdx]!;
      tileIds.push(blank.id);
      blankLetters[blank.id] = letter.toUpperCase();
      available.splice(blankIdx, 1);
      continue;
    }
    return null;
  }

  return { tileIds, blankLetters };
}

function tryPlaceWordOnBoard(
  state: GameState,
  word: string,
  assignment: RackAssignment,
  row: number,
  col: number,
  horizontal: boolean
): MoveCandidate | null {
  const letters = word.toLowerCase().replace(/ё/g, "е").split("");
  const usedTileIds = new Set<string>();
  const placements: PendingPlacement[] = [];
  const blankLetters: Record<string, string> = {};

  for (let i = 0; i < letters.length; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return null;

    const cell = state.board[r]![c]!;
    const letter = letters[i]!;

    if (cell.tile) {
      if (getLetter(cell.tile) !== letter) return null;
      continue;
    }

    const tileId = assignment.tileIds[i]!;
    if (usedTileIds.has(tileId)) return null;
    usedTileIds.add(tileId);
    placements.push({ row: r, col: c, tileId });
    if (assignment.blankLetters[tileId]) {
      blankLetters[tileId] = assignment.blankLetters[tileId]!;
    }
  }

  if (placements.length === 0) return null;

  try {
    const next = placeTiles(state, state.players[state.currentPlayerIndex]!.id, placements, blankLetters);
    const lastMove = next.moves[next.moves.length - 1];
    return {
      placements,
      blankLetters,
      score: lastMove?.score ?? 0,
    };
  } catch {
    return null;
  }
}

function findMoveCandidates(state: GameState, playerId: string): MoveCandidate[] {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];

  const candidates: MoveCandidate[] = [];
  const hasTiles = boardHasTiles(state);
  const maxLen = player.rack.length;
  const words = getCandidateWords(maxLen);

  const sampleSize = state.botDifficulty === "hard" ? 4000 : state.botDifficulty === "medium" ? 2000 : 800;
  const sampled =
    words.length <= sampleSize
      ? words
      : words.filter((_, i) => i % Math.ceil(words.length / sampleSize) === 0);

  for (const rawWord of sampled) {
    const assignment = assignRackToWord(player.rack, rawWord);
    if (!assignment) continue;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        for (const horizontal of [true, false]) {
          const move = tryPlaceWordOnBoard(state, rawWord, assignment, row, col, horizontal);
          if (!move) continue;
          if (!hasTiles && !move.placements.some((p) => p.row === CENTER && p.col === CENTER)) {
            continue;
          }
          candidates.push(move);
        }
      }
    }
  }

  return candidates;
}

function pickMove(candidates: MoveCandidate[], difficulty: BotDifficulty): MoveCandidate | null {
  if (candidates.length === 0) return null;

  switch (difficulty) {
    case "easy":
      return candidates[Math.floor(Math.random() * candidates.length)]!;
    case "medium":
      candidates.sort((a, b) => b.score - a.score || b.placements.length - a.placements.length);
      return candidates[Math.min(Math.floor(candidates.length * 0.3), candidates.length - 1)]!;
    case "hard":
      candidates.sort((a, b) => b.score - a.score || b.placements.length - a.placements.length);
      return candidates[0]!;
  }
}

export function executeBotTurn(state: GameState, botId: string): GameState {
  if (state.status !== "playing") return state;
  const current = state.players[state.currentPlayerIndex];
  if (!current || current.id !== botId || !current.isBot) return state;

  const difficulty = state.botDifficulty ?? "medium";
  const candidates = findMoveCandidates(state, botId);
  const move = pickMove(candidates, difficulty);

  if (move) {
    return placeTiles(state, botId, move.placements, move.blankLetters);
  }

  const bot = state.players.find((p) => p.id === botId)!;
  if (state.bag.length >= bot.rack.length && bot.rack.length > 0 && difficulty !== "easy") {
    const count = difficulty === "hard" ? bot.rack.length : Math.min(3, bot.rack.length);
    const tileIds = bot.rack.slice(0, count).map((t) => t.id);
    return exchangeTiles(state, botId, tileIds);
  }

  return passTurn(state, botId);
}

export async function processBotTurns(
  id: string,
  load: (id: string) => Promise<GameState | null>,
  update: (id: string, updater: (state: GameState) => GameState) => Promise<GameState>
): Promise<void> {
  for (let step = 0; step < 4; step++) {
    const state = await load(id);
    if (!state || state.status !== "playing") break;
    const current = state.players[state.currentPlayerIndex];
    if (!current?.isBot || current.surrendered) break;
    await update(id, (s) => executeBotTurn(s, current.id));
  }
}
