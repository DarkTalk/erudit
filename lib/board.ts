import { BOARD_SIZE, CENTER, type BonusType, type BoardCell } from "./types";

const TW = new Set(["0,0", "0,7", "0,14", "7,0", "7,14", "14,0", "14,7", "14,14"]);
const DW = new Set(["1,1", "2,2", "3,3", "4,4", "10,10", "11,11", "12,12", "13,13", "1,13", "2,12", "3,11", "4,10", "10,4", "11,3", "12,2", "13,1", "7,7"]);
const TL = new Set(["1,5", "1,9", "5,1", "5,5", "5,9", "5,13", "9,1", "9,5", "9,9", "9,13", "13,5", "13,9"]);
const DL = new Set(["0,3", "0,11", "3,0", "3,7", "3,14", "7,3", "7,11", "11,0", "11,7", "11,14", "14,3", "14,11"]);

function cellBonus(row: number, col: number): BonusType | null {
  const key = `${row},${col}`;
  if (row === CENTER && col === CENTER) return "STAR";
  if (TW.has(key)) return "TW";
  if (DW.has(key)) return "DW";
  if (TL.has(key)) return "TL";
  if (DL.has(key)) return "DL";
  return null;
}

export function createEmptyBoard(): BoardCell[][] {
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => ({
      tile: null,
      bonus: cellBonus(row, col),
    }))
  );
}

export function bonusLabel(bonus: BonusType | null): string {
  switch (bonus) {
    case "TW":
      return "×3";
    case "DW":
      return "×2";
    case "TL":
      return "+3";
    case "DL":
      return "+2";
    case "STAR":
      return "★";
    default:
      return "";
  }
}

/** Background for empty cells (Cream & Wood palette). */
export function bonusColor(bonus: BonusType | null): string {
  switch (bonus) {
    case "TW":
      return "bg-[#e8c5b0]";
    case "DW":
      return "bg-[#e8b8c8]";
    case "TL":
      return "bg-[#b8d8e8]";
    case "DL":
      return "bg-[#b8e0d8]";
    case "STAR":
      return "bg-[#e8c5b0]";
    default:
      return "bg-[#ede7d9]";
  }
}

/** Muted label text on bonus squares. */
export function bonusLabelColor(bonus: BonusType | null): string {
  switch (bonus) {
    case "TW":
      return "text-[#9a5a3a]";
    case "DW":
      return "text-[#8a3a58]";
    case "TL":
      return "text-[#2a6a8a]";
    case "DL":
      return "text-[#2a7a6a]";
    case "STAR":
      return "text-[#9a5a3a]";
    default:
      return "text-[#a89a88]";
  }
}
