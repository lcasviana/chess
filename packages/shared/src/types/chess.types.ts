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
