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

export interface Player {
  id: string;
  name: string;
  score: number;
  rack: RackTile[];
  connected: boolean;
  lastSeen: number;
}

export interface PendingPlacement {
  row: number;
  col: number;
  tileId: string;
}

export interface GameMove {
  playerId: string;
  type: "place" | "exchange" | "pass";
  placements?: { row: number; col: number; tileId: string }[];
  exchangedTileIds?: string[];
  words?: string[];
  score?: number;
  timestamp: number;
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
}

export interface CreateGameRequest {
  playerName: string;
  maxPlayers?: number;
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
