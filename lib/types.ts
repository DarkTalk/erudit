export type BonusType = "TW" | "DW" | "TL" | "DL" | "STAR";

export interface PlacedTile {
  letter: string;
  isBlank?: boolean;
  blankLetter?: string;
  isNew?: boolean;
}

export interface BoardCell {
  tile: PlacedTile | null;
  bonus: BonusType | null;
}

export interface RackTile {
  id: string;
  letter: string;
  isBlank?: boolean;
}

export type MatchType = "friends" | "bot" | "open" | "local";
export type BotDifficulty = "easy" | "medium" | "hard";

export interface Player {
  id: string;
  name: string;
  score: number;
  rack: RackTile[];
  connected: boolean;
  lastSeen: number;
  isBot?: boolean;
  /** Игрок сдался; не ходит, но остаётся в таблице счёта */
  surrendered?: boolean;
}

export interface PendingPlacement {
  row: number;
  col: number;
  tileId: string;
}

export interface GameMove {
  playerId: string;
  type: "place" | "exchange" | "pass" | "surrender";
  placements?: { row: number; col: number; tileId: string }[];
  exchangedTileIds?: string[];
  words?: string[];
  score?: number;
  timestamp: number;
}

export type GameMode = "normal" | "crossword";

export interface GameSettings {
  mode: GameMode;
  tileBagSize: number;
  startingWord: boolean;
  /** null — без лимита времени на ход */
  turnTimeSeconds: number | null;
}

export interface GameState {
  id: string;
  createdAt: number;
  status: "waiting" | "playing" | "finished";
  hostId: string;
  players: Player[];
  board: BoardCell[][];
  bag: RackTile[];
  currentPlayerIndex: number;
  moves: GameMove[];
  consecutivePasses: number;
  winnerId: string | null;
  maxPlayers: number;
  settings: GameSettings;
  matchType: MatchType;
  isPublic?: boolean;
  botDifficulty?: BotDifficulty;
  /** Слово на доске при старте (если startingWord), видно всем после начала */
  initialWord?: string;
  /** Момент начала текущего хода (Unix ms), если включён лимит времени */
  turnStartedAt?: number;
}

export interface CreateGameRequest {
  playerName: string;
  maxPlayers?: number;
  playerNames?: string[];
  settings?: Partial<GameSettings>;
  matchType?: MatchType;
  botDifficulty?: BotDifficulty;
}

export interface OpenGameSummary {
  id: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: number;
}

export interface UpdateGameSettingsRequest {
  playerId: string;
  settings: Partial<GameSettings>;
}

export interface JoinGameRequest {
  playerName: string;
}

export interface PlaceTilesRequest {
  playerId: string;
  placements: { row: number; col: number; tileId: string }[];
}

export interface ExchangeTilesRequest {
  playerId: string;
  tileIds: string[];
}

export interface PassTurnRequest {
  playerId: string;
}

export const BOARD_SIZE = 15;
export const CENTER = 7;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const RACK_SIZE = 7;
export const STARTING_WORD_LENGTH = 7;
export const DEFAULT_TILE_BAG_SIZE = 109;
export const MIN_TILE_BAG_SIZE = 50;
export const MAX_TILE_BAG_SIZE = 109;

export const MIN_TURN_TIME_SECONDS = 20;
export const MAX_TURN_TIME_SECONDS = 300;

/** Варианты лимита времени на ход (секунды) */
export const TURN_TIME_OPTIONS: number[] = [
  20, 30, 45, 60, 90, 120, 180, 240, 300,
];

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  mode: "crossword",
  tileBagSize: DEFAULT_TILE_BAG_SIZE,
  startingWord: false,
  turnTimeSeconds: null,
};
