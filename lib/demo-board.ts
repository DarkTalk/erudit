import { createEmptyBoard } from "./board";
import { CENTER, type BoardCell } from "./types";

function placeWord(
  board: BoardCell[][],
  word: string,
  row: number,
  col: number,
  horizontal: boolean
): void {
  for (let i = 0; i < word.length; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    const letter = word[i]!;
    const existing = board[r]![c]!.tile;
    if (existing && existing.letter.toUpperCase() !== letter.toUpperCase()) {
      throw new Error(`Conflict at ${r},${c}: ${existing.letter} vs ${letter}`);
    }
    if (!existing) {
      board[r]![c] = {
        ...board[r]![c]!,
        tile: { letter },
      };
    }
  }
}

/**
 * Mid-game demo (crossword): every horizontal and vertical run of 2+ letters is a valid word.
 * «ИГРА» (first move through ★) → «КОРТ» → «КОТ».
 */
export function createHomeDemoBoard(): BoardCell[][] {
  const board = createEmptyBoard();

  placeWord(board, "ИГРА", CENTER - 2, CENTER, false);
  placeWord(board, "КОРТ", CENTER, CENTER - 2, true);
  placeWord(board, "КОТ", CENTER, CENTER - 2, false);

  return board;
}

/**
 * Normal mode demo: «ЛАМПА» and «ИМЯ» share columns (М/И, А/М, П/Я) on adjacent rows.
 * Invalid in crossword (letter under letter); diagonal-only offsets are allowed in crossword.
 */
export function createNormalDemoBoard(): BoardCell[][] {
  const board = createEmptyBoard();

  placeWord(board, "ЛАМПА", CENTER, CENTER - 2, true);
  placeWord(board, "ИМЯ", CENTER + 1, CENTER - 1, true);

  return board;
}
