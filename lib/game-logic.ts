import { nanoid } from "nanoid";
import { createEmptyBoard } from "./board";
import { isValidWord, pickRandomSevenLetterWord } from "./dictionary";
import { createTileBag, drawTiles, tilePoints } from "./tiles";
import {
  BOARD_SIZE,
  CENTER,
  DEFAULT_GAME_SETTINGS,
  MAX_PLAYERS,
  MAX_TILE_BAG_SIZE,
  MAX_TURN_TIME_SECONDS,
  MIN_PLAYERS,
  MIN_TILE_BAG_SIZE,
  MIN_TURN_TIME_SECONDS,
  RACK_SIZE,
  TURN_TIME_OPTIONS,
  STARTING_WORD_LENGTH,
  type BoardCell,
  type GameMove,
  type GameSettings,
  type GameState,
  type MatchType,
  type BotDifficulty,
  type PendingPlacement,
  type PlacedTile,
  type Player,
  type RackTile,
} from "./types";

function normalizeTurnTimeSeconds(value: unknown): number | null {
  if (value === null || value === undefined || value === false) return null;
  const seconds = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const clamped = Math.min(
    MAX_TURN_TIME_SECONDS,
    Math.max(MIN_TURN_TIME_SECONDS, Math.round(seconds))
  );
  if (!TURN_TIME_OPTIONS.includes(clamped)) {
    return TURN_TIME_OPTIONS.reduce((best, option) =>
      Math.abs(option - clamped) < Math.abs(best - clamped) ? option : best
    );
  }
  return clamped;
}

function normalizeSettings(partial?: Partial<GameSettings>): GameSettings {
  const mode = partial?.mode === "crossword" ? "crossword" : "normal";
  const tileBagSize = Math.min(
    MAX_TILE_BAG_SIZE,
    Math.max(MIN_TILE_BAG_SIZE, partial?.tileBagSize ?? DEFAULT_GAME_SETTINGS.tileBagSize)
  );
  const startingWord = partial?.startingWord === true;
  const turnTimeSeconds = normalizeTurnTimeSeconds(partial?.turnTimeSeconds);

  return { mode, tileBagSize, startingWord, turnTimeSeconds };
}

function beginTurn(state: GameState): GameState {
  if (state.status !== "playing" || !state.settings.turnTimeSeconds) {
    const { turnStartedAt: _, ...rest } = state;
    return rest;
  }
  return { ...state, turnStartedAt: Date.now() };
}

function finalizeAfterTurnChange(state: GameState): GameState {
  return beginTurn(checkGameEnd(state));
}

export function applyTurnTimeout(state: GameState): GameState {
  if (state.status !== "playing") return state;
  const limit = state.settings.turnTimeSeconds;
  if (!limit) return state;

  const startedAt = state.turnStartedAt ?? Date.now();
  if (!state.turnStartedAt) {
    return { ...state, turnStartedAt: startedAt };
  }

  if (Date.now() - startedAt < limit * 1000) return state;

  const current = state.players[state.currentPlayerIndex];
  if (!current || current.surrendered) return state;

  return passTurn(state, current.id);
}

export function turnAdvanced(before: GameState, after: GameState): boolean {
  return (
    before.moves.length !== after.moves.length ||
    before.currentPlayerIndex !== after.currentPlayerIndex ||
    before.status !== after.status
  );
}

export function createGame(
  hostName: string,
  maxPlayers = 4,
  settings?: Partial<GameSettings>,
  matchType: MatchType = "friends"
): GameState {
  const hostId = nanoid(10);
  const gameSettings = normalizeSettings(settings);
  const bag = createTileBag(gameSettings.tileBagSize);
  const [rack] = drawTiles(bag, RACK_SIZE);

  return {
    id: nanoid(8),
    createdAt: Date.now(),
    status: "waiting",
    hostId,
    matchType,
    players: [
      {
        id: hostId,
        name: hostName.trim().slice(0, 20) || "Игрок",
        score: 0,
        rack,
        connected: true,
        lastSeen: Date.now(),
      },
    ],
    board: createEmptyBoard(),
    bag,
    currentPlayerIndex: 0,
    moves: [],
    consecutivePasses: 0,
    winnerId: null,
    maxPlayers: Math.min(Math.max(maxPlayers, MIN_PLAYERS), MAX_PLAYERS),
    settings: gameSettings,
  };
}

const BOT_NAMES: Record<BotDifficulty, string> = {
  easy: "Бот (простой)",
  medium: "Бот (средний)",
  hard: "Бот (сложный)",
};

export function createBotGame(
  hostName: string,
  difficulty: BotDifficulty,
  settings?: Partial<GameSettings>
): GameState {
  const botId = nanoid(10);
  let state = createGame(hostName, 2, settings, "bot");
  state = {
    ...state,
    maxPlayers: 2,
    botDifficulty: difficulty,
    players: [
      state.players[0]!,
      {
        id: botId,
        name: BOT_NAMES[difficulty],
        score: 0,
        rack: [],
        connected: true,
        lastSeen: Date.now(),
        isBot: true,
      },
    ],
  };
  return startGame(state, state.hostId);
}

export function createOpenGame(
  hostName: string,
  settings?: Partial<GameSettings>
): GameState {
  return {
    ...createGame(hostName, 4, settings, "open"),
    isPublic: true,
  };
}

export function createLocalGame(
  playerNames: string[],
  settings?: Partial<GameSettings>
): GameState {
  const names = playerNames.map((n, i) => n.trim().slice(0, 20) || `Игрок ${i + 1}`);
  if (names.length < MIN_PLAYERS || names.length > MAX_PLAYERS) {
    throw new Error(`Нужно от ${MIN_PLAYERS} до ${MAX_PLAYERS} игроков`);
  }

  let state = createGame(names[0]!, names.length, settings, "local");
  for (let i = 1; i < names.length; i++) {
    const result = joinGame(state, names[i]!);
    state = result.state;
  }

  return startGame(state, state.hostId);
}

export function updateGameSettings(
  state: GameState,
  hostId: string,
  partial: Partial<GameSettings>
): GameState {
  if (state.hostId !== hostId) throw new Error("Только хост может менять настройки");
  if (state.status !== "waiting") throw new Error("Настройки можно менять только до начала игры");

  const settings = normalizeSettings({ ...state.settings, ...partial });
  const bag = createTileBag(settings.tileBagSize);

  return {
    ...state,
    settings,
    bag,
  };
}

export function joinGame(state: GameState, playerName: string): { state: GameState; playerId: string } {
  if (state.status !== "waiting") throw new Error("Игра уже началась");
  if (state.players.length >= state.maxPlayers) throw new Error("Комната заполнена");

  const playerId = nanoid(10);
  const player: Player = {
    id: playerId,
    name: playerName.trim().slice(0, 20) || "Игрок",
    score: 0,
    rack: [],
    connected: true,
    lastSeen: Date.now(),
  };

  return {
    state: { ...state, players: [...state.players, player] },
    playerId,
  };
}

export function startGame(state: GameState, hostId: string): GameState {
  if (state.hostId !== hostId) throw new Error("Только хост может начать игру");
  if (state.status !== "waiting") throw new Error("Игра уже началась");
  if (state.players.length < MIN_PLAYERS) throw new Error(`Нужно минимум ${MIN_PLAYERS} игрока`);

  let bag = createTileBag(state.settings.tileBagSize);
  let board = createEmptyBoard();
  let initialWord: string | undefined;

  if (state.settings.startingWord) {
    const placed = placeInitialWord(board, bag);
    board = placed.board;
    bag = placed.bag;
    initialWord = placed.word;
  }

  const players = state.players.map((p) => {
    const [rack, newBag] = drawTiles(bag, RACK_SIZE);
    bag = newBag;
    return { ...p, rack, score: 0 };
  });

  return beginTurn({
    ...state,
    status: "playing",
    players,
    board,
    bag,
    currentPlayerIndex: 0,
    moves: [],
    consecutivePasses: 0,
    winnerId: null,
    initialWord,
  });
}

function placeInitialWord(
  board: BoardCell[][],
  bag: RackTile[]
): { board: BoardCell[][]; bag: RackTile[]; word: string } {
  const newBoard = cloneBoard(board);
  let newBag = [...bag];

  for (let attempt = 0; attempt < 40; attempt++) {
    const word = pickRandomSevenLetterWord();
    const letters = word.split("");
    const startCol = CENTER - Math.floor(STARTING_WORD_LENGTH / 2);
    const row = CENTER;

    try {
      const workingBag = [...newBag];
      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i]!.toLowerCase();
        const tileIdx = workingBag.findIndex(
          (t) => !t.isBlank && t.letter.toLowerCase() === letter
        );
        if (tileIdx === -1) {
          throw new Error("missing letter");
        }
        workingBag.splice(tileIdx, 1);
      }

      for (let i = 0; i < letters.length; i++) {
        newBoard[row]![startCol + i] = {
          ...newBoard[row]![startCol + i]!,
          tile: { letter: letters[i]!.toUpperCase() },
        };
      }

      return { board: newBoard, bag: workingBag, word };
    } catch {
      continue;
    }
  }

  throw new Error("Не удалось подобрать начальное слово для мешка");
}

function getLetter(tile: PlacedTile): string {
  if (tile.isBlank && tile.blankLetter) return tile.blankLetter;
  return tile.letter === "?" ? "" : tile.letter;
}

function boardHasTiles(board: BoardCell[][]): boolean {
  return board.some((row) => row.some((cell) => cell.tile !== null));
}

function cloneBoard(board: BoardCell[][]): BoardCell[][] {
  return board.map((row) =>
    row.map((cell) => ({
      bonus: cell.bonus,
      tile: cell.tile ? { ...cell.tile } : null,
    }))
  );
}

function applyPlacements(
  board: BoardCell[][],
  placements: PendingPlacement[],
  rackById: Map<string, RackTile>,
  blankLetters: Record<string, string>
): BoardCell[][] {
  const newBoard = cloneBoard(board);

  for (const { row, col, tileId } of placements) {
    const rackTile = rackById.get(tileId);
    if (!rackTile) throw new Error("Фишка не найдена");

    const placed: PlacedTile = {
      letter: rackTile.isBlank ? "?" : rackTile.letter,
      isBlank: rackTile.isBlank,
      blankLetter: rackTile.isBlank ? blankLetters[tileId] : undefined,
      isNew: true,
    };

    newBoard[row][col].tile = placed;
  }

  return newBoard;
}

/** Новые фишки связны через ортогональные соседства (включая уже лежащие на поле). */
function placementsConnectedThroughBoard(
  board: BoardCell[][],
  placements: PendingPlacement[]
): boolean {
  if (placements.length <= 1) return placements.length === 1;

  const placementSet = new Set(placements.map((p) => `${p.row},${p.col}`));
  const start = placements[0]!;
  const visited = new Set<string>([`${start.row},${start.col}`]);
  const queue: [number, number][] = [[start.row, start.col]];

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      if (placementSet.has(key) || board[r][c].tile) {
        visited.add(key);
        queue.push([r, c]);
      }
    }
  }

  return placements.every((p) => visited.has(`${p.row},${p.col}`));
}

function hasTileAt(
  board: BoardCell[][],
  row: number,
  col: number,
  placementSet: Set<string>
): boolean {
  return !!board[row]?.[col]?.tile || placementSet.has(`${row},${col}`);
}

function runLengthThroughCell(
  board: BoardCell[][],
  row: number,
  col: number,
  horizontal: boolean,
  placementSet: Set<string>
): number {
  if (!hasTileAt(board, row, col, placementSet)) return 0;

  if (horizontal) {
    let minC = col;
    let maxC = col;
    while (minC > 0 && hasTileAt(board, row, minC - 1, placementSet)) minC--;
    while (maxC < BOARD_SIZE - 1 && hasTileAt(board, row, maxC + 1, placementSet)) maxC++;
    for (let c = minC; c <= maxC; c++) {
      if (!hasTileAt(board, row, c, placementSet)) return 0;
    }
    return maxC - minC + 1;
  }

  let minR = row;
  let maxR = row;
  while (minR > 0 && hasTileAt(board, minR - 1, col, placementSet)) minR--;
  while (maxR < BOARD_SIZE - 1 && hasTileAt(board, maxR + 1, col, placementSet)) maxR++;
  for (let r = minR; r <= maxR; r++) {
    if (!hasTileAt(board, r, col, placementSet)) return 0;
  }
  return maxR - minR + 1;
}

/** Горизонтальный и вертикальный ряд через клетку — без пустых клеток внутри. */
function placementWordRunsContinuous(
  board: BoardCell[][],
  row: number,
  col: number,
  placementSet: Set<string>
): boolean {
  if (!hasTileAt(board, row, col, placementSet)) return true;
  if (runLengthThroughCell(board, row, col, true, placementSet) === 0) return false;
  if (runLengthThroughCell(board, row, col, false, placementSet) === 0) return false;
  return true;
}

function eachPlacementInWordRun(
  board: BoardCell[][],
  placements: PendingPlacement[],
  placementSet: Set<string>
): boolean {
  for (const { row, col } of placements) {
    const horizontal = runLengthThroughCell(board, row, col, true, placementSet);
    const vertical = runLengthThroughCell(board, row, col, false, placementSet);
    if (horizontal < 2 && vertical < 2) return false;
  }
  return true;
}

/**
 * Новые фишки — одна связная группа; каждое образуемое слово (ряд/столбец) без пробелов.
 * Допускается перпендикулярное пересечение (два слова за ход).
 */
function placementsFormValidPlacement(
  board: BoardCell[][],
  placements: PendingPlacement[]
): boolean {
  if (placements.length === 0) return false;
  if (!placementsConnectedThroughBoard(board, placements)) return false;

  const placementSet = new Set(placements.map((p) => `${p.row},${p.col}`));
  for (const { row, col } of placements) {
    if (!placementWordRunsContinuous(board, row, col, placementSet)) return false;
  }
  return eachPlacementInWordRun(board, placements, placementSet);
}

function activePlayers(state: GameState): Player[] {
  return state.players.filter((p) => !p.surrendered);
}

function nextActivePlayerIndex(state: GameState, fromIndex?: number): number {
  const start = fromIndex ?? state.currentPlayerIndex;
  const n = state.players.length;
  for (let step = 1; step <= n; step++) {
    const idx = (start + step) % n;
    if (!state.players[idx]?.surrendered) return idx;
  }
  return start;
}

interface WordRun {
  horizontal: boolean;
  cells: [number, number][];
}

function getWordRun(
  board: BoardCell[][],
  row: number,
  col: number,
  horizontal: boolean
): [number, number][] {
  if (!board[row][col].tile) return [];

  if (horizontal) {
    let start = col;
    while (start > 0 && board[row][start - 1].tile) start--;
    let end = col;
    while (end < BOARD_SIZE - 1 && board[row][end + 1].tile) end++;
    const cells: [number, number][] = [];
    for (let c = start; c <= end; c++) cells.push([row, c]);
    return cells;
  }

  let start = row;
  while (start > 0 && board[start - 1][col].tile) start--;
  let end = row;
  while (end < BOARD_SIZE - 1 && board[end + 1][col].tile) end++;
  const cells: [number, number][] = [];
  for (let r = start; r <= end; r++) cells.push([r, col]);
  return cells;
}

function collectAffectedWordRuns(
  board: BoardCell[][],
  placementSet: Set<string>
): WordRun[] {
  const runs: WordRun[] = [];
  const seen = new Set<string>();

  for (const key of placementSet) {
    const [row, col] = key.split(",").map(Number) as [number, number];
    for (const horizontal of [true, false] as const) {
      const cells = getWordRun(board, row, col, horizontal);
      if (cells.length < 2) continue;
      const runKey = cells.map(([r, c]) => `${r},${c}`).join("|");
      if (seen.has(runKey)) continue;
      seen.add(runKey);
      runs.push({ horizontal, cells });
    }
  }

  return runs;
}

function normalizeLetter(letter: string): string {
  return letter.toLowerCase().replace(/ё/g, "е");
}

function cellLetter(board: BoardCell[][], row: number, col: number): string | null {
  const tile = board[row][col].tile;
  if (!tile) return null;
  return normalizeLetter(getLetter(tile));
}

/**
 * Две параллельные линии слов на соседних рядах/столбцах без общей клетки — «буква под буквой».
 * Только одна линия (тот же столбец для горизонталей / тот же ряд для вертикалей).
 */
function isLetterUnderLetterConflict(
  board: BoardCell[][],
  mainHorizontal: boolean,
  row: number,
  col: number,
  nr: number,
  nc: number
): boolean {
  if (mainHorizontal) {
    if (nc !== col) return false;
    const here = getWordRun(board, row, col, true);
    const there = getWordRun(board, nr, nc, true);
    return here.length >= 2 && there.length >= 2 && nr !== row;
  }
  if (nr !== row) return false;
  const here = getWordRun(board, row, col, false);
  const there = getWordRun(board, nr, nc, false);
  return here.length >= 2 && there.length >= 2 && nc !== col;
}

/**
 * Поперечное касание новой фишки с одной уже лежащей буквой (не словом) — не требует словаря.
 * Пример: «БОК» + «КОК» за ход, «О» касается одиночной «Ц».
 */
function isIncidentalIsolatedTouch(
  boardBefore: BoardCell[][],
  cells: [number, number][],
  placementSet: Set<string>
): boolean {
  if (cells.length !== 2) return false;

  const newCells = cells.filter(([r, c]) => placementSet.has(`${r},${c}`));
  const oldCells = cells.filter(([r, c]) => boardBefore[r]![c]!.tile);
  if (newCells.length !== 1 || oldCells.length !== 1) return false;

  const horizontal = cells[0]![0] === cells[1]![0];
  const [or, oc] = oldCells[0]!;
  return getWordRun(boardBefore, or, oc, !horizontal).length < 2;
}

function existingWordsOnBoard(board: BoardCell[][]): Set<string> {
  return new Set(
    extractWords(board).map(({ word }) => normalizeLetter(word))
  );
}

function validateCrosswordWordRun(
  boardBefore: BoardCell[][],
  boardAfter: BoardCell[][],
  run: WordRun,
  placementSet: Set<string>
): void {
  const sideTouchError =
    "Кроссворд: слова не могут соприкасаться сторонами без пересечения";
  const { horizontal, cells } = run;
  const [startRow, startCol] = cells[0]!;
  const [endRow, endCol] = cells[cells.length - 1]!;

  if (horizontal) {
    if (startCol > 0 && boardAfter[startRow]![startCol - 1]!.tile) {
      throw new Error(sideTouchError);
    }
    if (endCol < BOARD_SIZE - 1 && boardAfter[endRow]![endCol + 1]!.tile) {
      throw new Error(sideTouchError);
    }
  } else {
    if (startRow > 0 && boardAfter[startRow - 1]![startCol]!.tile) {
      throw new Error(sideTouchError);
    }
    if (endRow < BOARD_SIZE - 1 && boardAfter[endRow + 1]![endCol]!.tile) {
      throw new Error(sideTouchError);
    }
  }

  for (const [row, col] of cells) {
    const before = cellLetter(boardBefore, row, col);
    const after = cellLetter(boardAfter, row, col);
    if (before !== null && after !== before) {
      throw new Error("Кроссворд: нельзя заменять существующие буквы");
    }

    if (!placementSet.has(`${row},${col}`)) continue;

    // «Не пересекающаяся» буква — клетка была пустой до хода.
    if (boardBefore[row]![col]!.tile) continue;

    const perpHorizontal = !horizontal;
    const perpOffsets = horizontal
      ? ([[-1, 0], [1, 0]] as const)
      : ([[0, -1], [0, 1]] as const);
    const firstMove = !boardHasTiles(boardBefore);

    for (const [dr, dc] of perpOffsets) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
      if (!boardAfter[nr]![nc]!.tile) continue;

      // Сосед по линии основного слова (перекрёсток двух слов за ход)
      if (horizontal && nc === col) {
        const vertRun = getWordRun(boardAfter, row, col, false);
        if (vertRun.some(([r, c]) => r === nr && c === nc)) continue;
      } else if (!horizontal && nr === row) {
        const horizRun = getWordRun(boardAfter, row, col, true);
        if (horizRun.some(([r, c]) => r === nr && c === nc)) continue;
      }

      if (firstMove) {
        const crossingRun = getWordRun(boardAfter, row, col, perpHorizontal);
        const allowedFirstMoveCross =
          crossingRun.length >= 2 &&
          crossingRun.some(([r, c]) => r === nr && c === nc) &&
          crossingRun.every(([r, c]) => placementSet.has(`${r},${c}`));
        if (allowedFirstMoveCross) continue;
      } else if (
        getWordRun(boardBefore, nr, nc, perpHorizontal).length >= 2
      ) {
        continue;
      } else {
        const perpRunThroughNew = getWordRun(boardAfter, row, col, perpHorizontal);
        if (
          perpRunThroughNew.length >= 2 &&
          !isLetterUnderLetterConflict(
            boardAfter,
            horizontal,
            row,
            col,
            nr,
            nc
          )
        ) {
          continue;
        }
      }

      throw new Error(sideTouchError);
    }
  }
}

/**
 * Кроссворд: проверка хода по правилам пересечения слов.
 */
function validateCrosswordMove(
  boardBefore: BoardCell[][],
  placements: PendingPlacement[],
  rackById: Map<string, RackTile>,
  blankLetters: Record<string, string>
): void {
  const boardAfter = applyPlacements(
    boardBefore,
    placements,
    rackById,
    blankLetters
  );
  const placementSet = new Set(placements.map((p) => `${p.row},${p.col}`));
  const affectedRuns = collectAffectedWordRuns(boardAfter, placementSet);

  if (affectedRuns.length === 0) {
    throw new Error("Кроссворд: составьте слово из двух или более букв");
  }

  const cellsInRuns = new Set<string>();
  for (const run of affectedRuns) {
    for (const [r, c] of run.cells) cellsInRuns.add(`${r},${c}`);
  }
  for (const { row, col } of placements) {
    if (!cellsInRuns.has(`${row},${col}`)) {
      throw new Error("Каждая новая фишка должна входить в слово");
    }
  }

  const hasExisting = boardHasTiles(boardBefore);
  if (hasExisting) {
    let intersectsExisting = false;
    for (const run of affectedRuns) {
      for (const [r, c] of run.cells) {
        if (boardBefore[r]![c]!.tile) {
          intersectsExisting = true;
          break;
        }
      }
      if (intersectsExisting) break;
    }
    if (!intersectsExisting) {
      throw new Error("Кроссворд: новое слово должно пересекать существующее");
    }
  }

  for (const run of affectedRuns) {
    validateCrosswordWordRun(boardBefore, boardAfter, run, placementSet);
  }
}

function placementsConnectedToExisting(
  board: BoardCell[][],
  placements: PendingPlacement[]
): boolean {
  const hasExisting = boardHasTiles(board);
  if (!hasExisting) {
    return placements.some((p) => p.row === CENTER && p.col === CENTER);
  }

  for (const { row, col } of placements) {
    const neighbors = [
      [row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1],
    ];
    for (const [r, c] of neighbors) {
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue;
      const isPlacement = placements.some((p) => p.row === r && p.col === c);
      if (!isPlacement && board[r][c].tile) return true;
    }
  }
  return false;
}

function extractWords(board: BoardCell[][]): { word: string; cells: [number, number][] }[] {
  const words: { word: string; cells: [number, number][] }[] = [];
  const seen = new Set<string>();

  for (let row = 0; row < BOARD_SIZE; row++) {
    let word = "";
    let cells: [number, number][] = [];
    for (let col = 0; col <= BOARD_SIZE; col++) {
      const tile = col < BOARD_SIZE ? board[row][col].tile : null;
      if (tile) {
        word += getLetter(tile);
        cells.push([row, col]);
      } else if (word.length >= 2) {
        const key = cells.map(([r, c]) => `${r},${c}`).join("|");
        if (!seen.has(key)) {
          seen.add(key);
          words.push({ word, cells: [...cells] });
        }
        word = "";
        cells = [];
      } else {
        word = "";
        cells = [];
      }
    }
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    let word = "";
    let cells: [number, number][] = [];
    for (let row = 0; row <= BOARD_SIZE; row++) {
      const tile = row < BOARD_SIZE ? board[row][col].tile : null;
      if (tile) {
        word += getLetter(tile);
        cells.push([row, col]);
      } else if (word.length >= 2) {
        const key = cells.map(([r, c]) => `${r},${c}`).join("|");
        if (!seen.has(key)) {
          seen.add(key);
          words.push({ word, cells: [...cells] });
        }
        word = "";
        cells = [];
      } else {
        word = "";
        cells = [];
      }
    }
  }

  return words;
}

function scoreWord(
  board: BoardCell[][],
  cells: [number, number][]
): number {
  let wordScore = 0;
  let wordMultiplier = 1;

  for (const [row, col] of cells) {
    const cell = board[row][col];
    const tile = cell.tile!;
    const letter = getLetter(tile);
    let letterScore = tilePoints(letter, tile.isBlank);
    let letterMultiplier = 1;

    if (tile.isNew && cell.bonus) {
      switch (cell.bonus) {
        case "DL": letterMultiplier = 2; break;
        case "TL": letterMultiplier = 3; break;
        case "DW":
        case "STAR": wordMultiplier *= 2; break;
        case "TW": wordMultiplier *= 3; break;
      }
    }

    wordScore += letterScore * letterMultiplier;
  }

  return wordScore * wordMultiplier;
}

function scoreMove(board: BoardCell[][]): { total: number; words: string[] } {
  const allWords = extractWords(board);
  const newWords = allWords.filter(({ cells }) =>
    cells.some(([r, c]) => board[r][c].tile?.isNew)
  );

  let total = 0;
  const words: string[] = [];

  for (const { word, cells } of newWords) {
    total += scoreWord(board, cells);
    words.push(word);
  }

  if (newWords.length === 0) throw new Error("Не удалось составить слово");

  return { total, words };
}

function clearNewFlags(board: BoardCell[][]): BoardCell[][] {
  return board.map((row) =>
    row.map((cell) => ({
      ...cell,
      tile: cell.tile ? { ...cell.tile, isNew: false } : null,
    }))
  );
}

function nextPlayerIndex(state: GameState): number {
  return nextActivePlayerIndex(state);
}

function refillRack(player: Player, bag: RackTile[]): [Player, RackTile[]] {
  const needed = RACK_SIZE - player.rack.length;
  if (needed <= 0 || bag.length === 0) return [player, bag];
  const [drawn, newBag] = drawTiles(bag, Math.min(needed, bag.length));
  return [{ ...player, rack: [...player.rack, ...drawn] }, newBag];
}

function checkGameEnd(state: GameState): GameState {
  const playing = activePlayers(state);
  if (playing.length === 0) return state;

  const someoneEmpty = playing.some((p) => p.rack.length === 0);
  if (someoneEmpty && state.bag.length === 0) {
    const winner = [...playing].sort((a, b) => b.score - a.score)[0]!;
    return { ...state, status: "finished", winnerId: winner.id };
  }
  if (state.consecutivePasses >= playing.length) {
    const winner = [...playing].sort((a, b) => b.score - a.score)[0]!;
    return { ...state, status: "finished", winnerId: winner.id };
  }
  return state;
}

export function placeTiles(
  state: GameState,
  playerId: string,
  placements: PendingPlacement[],
  blankLetters: Record<string, string> = {}
): GameState {
  if (state.status !== "playing") throw new Error("Игра не идёт");
  const current = state.players[state.currentPlayerIndex];
  if (current.id !== playerId) throw new Error("Не ваш ход");
  if (current.surrendered) throw new Error("Вы сдались и больше не ходите");

  if (placements.length === 0) throw new Error("Разместите хотя бы одну фишку");

  const rackById = new Map(current.rack.map((t) => [t.id, t]));
  for (const p of placements) {
    if (!rackById.has(p.tileId)) throw new Error("Фишка не на вашей подставке");
    if (state.board[p.row][p.col].tile) throw new Error("Клетка занята");
    const tile = rackById.get(p.tileId)!;
    if (tile.isBlank && !blankLetters[p.tileId]) {
      throw new Error("Укажите букву для пустой фишки");
    }
  }

  if (!placementsFormValidPlacement(state.board, placements)) {
    throw new Error(
      "Новые фишки должны быть связаны и без пробелов в каждом слове"
    );
  }
  if (!placementsConnectedToExisting(state.board, placements)) {
    throw new Error("Первый ход — через центральную звезду, далее — к существующим словам");
  }

  const tempBoard = applyPlacements(state.board, placements, rackById, blankLetters);
  const allWords = extractWords(tempBoard);
  const affectedWords = allWords.filter(({ cells }) =>
    cells.some(([r, c]) => placements.some((p) => p.row === r && p.col === c))
  );

  const placementSet = new Set(placements.map((p) => `${p.row},${p.col}`));
  const wordsAlreadyOnBoard =
    state.settings.mode === "crossword"
      ? existingWordsOnBoard(state.board)
      : null;

  for (const { word, cells } of affectedWords) {
    const normalized = normalizeLetter(word);
    if (
      wordsAlreadyOnBoard?.has(normalized) &&
      !isIncidentalIsolatedTouch(state.board, cells, placementSet)
    ) {
      throw new Error(`Слово «${word}» уже выложено на доске`);
    }
    if (
      normalized.length >= 2 &&
      !isIncidentalIsolatedTouch(state.board, cells, placementSet) &&
      !isValidWord(normalized)
    ) {
      throw new Error(`«${word}» — неизвестное слово`);
    }
  }

  if (state.settings.mode === "crossword") {
    validateCrosswordMove(state.board, placements, rackById, blankLetters);
  }

  const { total, words } = scoreMove(tempBoard);
  const usedIds = new Set(placements.map((p) => p.tileId));
  const newRack = current.rack.filter((t) => !usedIds.has(t.id));
  const isBingo = placements.length === RACK_SIZE;

  let newBag = state.bag;
  let updatedPlayer: Player = {
    ...current,
    score: current.score + total + (isBingo ? 50 : 0),
    rack: newRack,
  };
  [updatedPlayer, newBag] = refillRack(updatedPlayer, newBag);

  const newPlayers = state.players.map((p) =>
    p.id === playerId ? updatedPlayer : p
  );

  const move: GameMove = {
    playerId,
    type: "place",
    placements,
    words,
    score: total + (isBingo ? 50 : 0),
    timestamp: Date.now(),
  };

  let newState: GameState = {
    ...state,
    board: clearNewFlags(tempBoard),
    players: newPlayers,
    bag: newBag,
    currentPlayerIndex: nextPlayerIndex(state),
    moves: [...state.moves, move],
    consecutivePasses: 0,
  };

  return finalizeAfterTurnChange(newState);
}

export function exchangeTiles(
  state: GameState,
  playerId: string,
  tileIds: string[]
): GameState {
  if (state.status !== "playing") throw new Error("Игра не идёт");
  const current = state.players[state.currentPlayerIndex];
  if (current.id !== playerId) throw new Error("Не ваш ход");
  if (current.surrendered) throw new Error("Вы сдались и больше не ходите");
  if (state.bag.length < tileIds.length) throw new Error("В мешке недостаточно фишок");
  if (tileIds.length === 0) throw new Error("Выберите фишки для обмена");

  const rackById = new Map(current.rack.map((t) => [t.id, t]));
  for (const id of tileIds) {
    if (!rackById.has(id)) throw new Error("Фишка не на вашей подставке");
  }

  const toReturn = tileIds.map((id) => rackById.get(id)!);
  const remaining = current.rack.filter((t) => !tileIds.includes(t.id));
  const [drawn, newBag] = drawTiles(state.bag, tileIds.length);

  const updatedPlayer: Player = { ...current, rack: [...remaining, ...drawn] };
  const newPlayers = state.players.map((p) =>
    p.id === playerId ? updatedPlayer : p
  );

  const move: GameMove = {
    playerId,
    type: "exchange",
    exchangedTileIds: tileIds,
    timestamp: Date.now(),
  };

  return finalizeAfterTurnChange({
    ...state,
    players: newPlayers,
    bag: [...newBag, ...toReturn],
    currentPlayerIndex: nextPlayerIndex(state),
    moves: [...state.moves, move],
    consecutivePasses: 0,
  });
}

export function surrender(state: GameState, playerId: string): GameState {
  if (state.status !== "playing") throw new Error("Игра не идёт");
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Игрок не найден");
  if (player.surrendered) throw new Error("Вы уже сдались");

  const move: GameMove = {
    playerId,
    type: "surrender",
    timestamp: Date.now(),
  };

  let newState: GameState = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, surrendered: true, rack: [] } : p
    ),
    bag: [...state.bag, ...player.rack],
    moves: [...state.moves, move],
    consecutivePasses: 0,
  };

  const remaining = activePlayers(newState);
  if (remaining.length <= 1) {
    const winner =
      remaining[0] ??
      [...newState.players.filter((p) => p.id !== playerId)].sort(
        (a, b) => b.score - a.score
      )[0];
    if (!winner) throw new Error("Нет соперников");
    return {
      ...newState,
      status: "finished",
      winnerId: winner.id,
    };
  }

  if (state.players[state.currentPlayerIndex]?.id === playerId) {
    newState = {
      ...newState,
      currentPlayerIndex: nextActivePlayerIndex(newState, state.currentPlayerIndex),
    };
    return beginTurn(newState);
  }

  return newState;
}

export function passTurn(state: GameState, playerId: string): GameState {
  if (state.status !== "playing") throw new Error("Игра не идёт");
  const current = state.players[state.currentPlayerIndex];
  if (current.id !== playerId) throw new Error("Не ваш ход");
  if (current.surrendered) throw new Error("Вы сдались и больше не ходите");

  const move: GameMove = {
    playerId,
    type: "pass",
    timestamp: Date.now(),
  };

  let newState: GameState = {
    ...state,
    currentPlayerIndex: nextPlayerIndex(state),
    moves: [...state.moves, move],
    consecutivePasses: state.consecutivePasses + 1,
  };

  return finalizeAfterTurnChange(newState);
}

export function updatePlayerPresence(
  state: GameState,
  playerId: string
): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, connected: true, lastSeen: Date.now() } : p
    ),
  };
}
