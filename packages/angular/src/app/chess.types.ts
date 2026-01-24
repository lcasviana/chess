import type { Color, PieceSymbol, Square } from "chess.js";

export type ChessPieceType = {
  id: string;
  color: Color;
  type: PieceSymbol;
};

export type ChessSquareColor = "light" | "dark" | null;

export type ChessSquareInCheck = "check" | "checkmate" | null;

export type GameResult = {
  type: "win" | "lose" | "draw" | "stalemate";
  player: Color | null;
};

export type LastMove = {
  from: Square;
  to: Square;
};

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export const COLOR_NAMES: Readonly<Record<Color, string>> = Object.freeze({
  w: "White",
  b: "Black",
});

export const PIECE_NAMES: Readonly<Record<PieceSymbol, string>> = Object.freeze({
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
});

export const PIECE_VALUES: Readonly<Record<PieceSymbol, number>> = Object.freeze({
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
});
