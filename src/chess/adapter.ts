import { ChessEngine } from "./chess";
import { SQ_INDEX, SQ_NAMES } from "./constants";
import { toSan } from "./san";
import { MoveFlags, Piece } from "./types";
import type { Move, Square } from "./types";

export type ChessColor = "w" | "b";
export type ChessSquare =
  | "a1"
  | "b1"
  | "c1"
  | "d1"
  | "e1"
  | "f1"
  | "g1"
  | "h1"
  | "a2"
  | "b2"
  | "c2"
  | "d2"
  | "e2"
  | "f2"
  | "g2"
  | "h2"
  | "a3"
  | "b3"
  | "c3"
  | "d3"
  | "e3"
  | "f3"
  | "g3"
  | "h3"
  | "a4"
  | "b4"
  | "c4"
  | "d4"
  | "e4"
  | "f4"
  | "g4"
  | "h4"
  | "a5"
  | "b5"
  | "c5"
  | "d5"
  | "e5"
  | "f5"
  | "g5"
  | "h5"
  | "a6"
  | "b6"
  | "c6"
  | "d6"
  | "e6"
  | "f6"
  | "g6"
  | "h6"
  | "a7"
  | "b7"
  | "c7"
  | "d7"
  | "e7"
  | "f7"
  | "g7"
  | "h7"
  | "a8"
  | "b8"
  | "c8"
  | "d8"
  | "e8"
  | "f8"
  | "g8"
  | "h8";
export type ChessPieceSymbol = "p" | "n" | "b" | "r" | "q" | "k";
export type ChessPiece = { type: ChessPieceSymbol; color: ChessColor };
export type ChessMove = {
  from: ChessSquare;
  to: ChessSquare;
  piece: ChessPieceSymbol;
  color: ChessColor;
  captured?: ChessPieceSymbol;
  promotion?: ChessPieceSymbol;
  flags: string;
  san: string;
};

export const SQUARES: ChessSquare[] = SQ_NAMES as ChessSquare[];

const COLOR_TO_STR: ChessColor[] = ["b", "w"];
const PIECE_TO_STR: ChessPieceSymbol[] = ["p", "n", "b", "r", "q", "k", "p", "p"];

function colorToStr(c: number): ChessColor {
  return COLOR_TO_STR[c];
}

function pieceToStr(p: number): ChessPieceSymbol {
  return PIECE_TO_STR[p];
}

function strToPiece(s: ChessPieceSymbol): number {
  switch (s) {
    case "p":
      return Piece.Pawn;
    case "n":
      return Piece.Knight;
    case "b":
      return Piece.Bishop;
    case "r":
      return Piece.Rook;
    case "q":
      return Piece.Queen;
    case "k":
      return Piece.King;
  }
}

function sqToStr(s: Square): ChessSquare {
  return SQ_NAMES[s] as ChessSquare;
}

function strToSq(s: ChessSquare): Square {
  return SQ_INDEX[s];
}

function flagsToStr(flags: number): string {
  const isCapture = (flags & MoveFlags.Capture) !== 0;
  const isPromo = (flags & MoveFlags.Promotion) !== 0;
  if (flags & MoveFlags.EnPassant) return "e";
  if (flags & MoveFlags.CastleKing) return "k";
  if (flags & MoveFlags.CastleQueen) return "q";
  if (flags & MoveFlags.DoublePush) return "b";
  if (isPromo && isCapture) return "cp";
  if (isPromo) return "p";
  if (isCapture) return "c";
  return "n";
}

function moveToChess(m: Move, san: string): ChessMove {
  const result: ChessMove = {
    from: sqToStr(m.from),
    to: sqToStr(m.to),
    piece: pieceToStr(m.piece),
    color: colorToStr(m.color),
    flags: flagsToStr(m.flags),
    san,
  };
  if (m.captured !== Piece.None) {
    result.captured = pieceToStr(m.captured);
  }
  if (m.promotion !== Piece.None) {
    result.promotion = pieceToStr(m.promotion);
  }
  return result;
}

export class Chess {
  private engine: ChessEngine;
  private sanHistory: string[];
  private moveHistory: Move[];

  constructor(fen?: string) {
    this.engine = new ChessEngine(fen);
    this.sanHistory = [];
    this.moveHistory = [];
  }

  load(fen: string): void {
    this.engine.load(fen);
    this.sanHistory = [];
    this.moveHistory = [];
  }

  reset(): void {
    this.engine.reset();
    this.sanHistory = [];
    this.moveHistory = [];
  }

  fen(): string {
    return this.engine.fen();
  }

  turn(): ChessColor {
    return colorToStr(this.engine.turn());
  }

  board(): (ChessPiece | null)[][] {
    const result: (ChessPiece | null)[][] = [];
    for (let rank = 7; rank >= 0; rank--) {
      const row: (ChessPiece | null)[] = [];
      for (let file = 0; file < 8; file++) {
        const sq = rank * 8 + file;
        const p = this.engine.pieceAt(sq);
        row.push(p ? { type: pieceToStr(p.piece), color: colorToStr(p.color) } : null);
      }
      result.push(row);
    }
    return result;
  }

  moves(options: { verbose: true; square?: ChessSquare }): ChessMove[];
  moves(options?: { verbose?: false; square?: ChessSquare }): string[];
  moves(options?: { verbose?: boolean; square?: ChessSquare }): ChessMove[] | string[] {
    const moves = this.legalMoves(options?.square);
    if (options?.verbose) return moves;
    return moves.map((m) => m.san);
  }

  legalMoves(square?: ChessSquare): ChessMove[] {
    const b = this.engine.board;
    const moves = square ? this.engine.legalMovesFrom(strToSq(square)) : this.engine.legalMoves();
    const legal = this.engine.legalMoves();
    return moves.map((m) => moveToChess(m, toSan(m, b, legal)));
  }

  move(input: { from: ChessSquare; to: ChessSquare; promotion?: ChessPieceSymbol }): ChessMove {
    const from = strToSq(input.from);
    const to = strToSq(input.to);
    const promotion = input.promotion ? strToPiece(input.promotion) : Piece.None;

    const legal = this.engine.legalMovesFrom(from);
    const match = legal.find((m) => m.from === from && m.to === to && (promotion === Piece.None || m.promotion === promotion));

    if (!match) {
      throw new Error(`Illegal move: ${input.from}${input.to}`);
    }

    const b = this.engine.board;
    const allLegal = this.engine.legalMoves();
    const san = toSan(match, b, allLegal);

    this.engine.makeMove(match);
    this.sanHistory.push(san);
    this.moveHistory.push(match);

    return moveToChess(match, san);
  }

  undo(): ChessMove | undefined {
    if (this.moveHistory.length === 0) return undefined;
    this.engine.unmakeMove();
    const move = this.moveHistory.pop()!;
    const san = this.sanHistory.pop()!;
    return moveToChess(move, san);
  }

  isCheck(): boolean {
    return this.engine.isCheck();
  }

  isCheckmate(): boolean {
    return this.engine.isCheckmate();
  }

  isDraw(): boolean {
    return this.engine.isDraw();
  }

  isGameOver(): boolean {
    return this.isCheckmate() || this.isDraw();
  }

  isStalemate(): boolean {
    return this.engine.isStalemate();
  }

  isThreefoldRepetition(): boolean {
    return this.engine.isThreefoldRepetition();
  }

  isInsufficientMaterial(): boolean {
    return this.engine.isInsufficientMaterial();
  }

  squareColor(sq: ChessSquare): "light" | "dark" {
    const s = strToSq(sq);
    return ((s & 7) + (s >> 3)) % 2 === 0 ? "dark" : "light";
  }

  history(): string[] {
    return [...this.sanHistory];
  }
}
