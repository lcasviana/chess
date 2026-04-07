import { CastleFlag } from "./board";
import type { ChessBoard } from "./board";
import { SQ_INDEX, SQ_NAMES, sqOf } from "./constants";
import { Color } from "./types";
import type { Piece } from "./types";
import type { Bitboard, Square } from "./types";

export type FenState = {
  pieces: [Bitboard[], Bitboard[]];
  turn: Color;
  castling: number;
  enPassant: Square | -1;
  halfmove: number;
  fullmove: number;
};

const PIECE_CHARS = "PNBRQKpnbrqk";

function charToColorPiece(ch: string): [Color, Piece] {
  const idx = PIECE_CHARS.indexOf(ch);
  if (idx < 6) return [Color.White, idx as Piece];
  return [Color.Black, (idx - 6) as Piece];
}

export function parseFen(fen: string): FenState {
  const parts = fen.trim().split(/\s+/);
  const ranks = parts[0].split("/");

  const pieces: [Bitboard[], Bitboard[]] = [Array.from({ length: 8 }, () => 0n), Array.from({ length: 8 }, () => 0n)];

  for (let r = 0; r < 8; r++) {
    const rankStr = ranks[r];
    const rank = 7 - r; // FEN rank 0 = rank 8 (index 7)
    let file = 0;
    for (const ch of rankStr) {
      const skip = parseInt(ch, 10);
      if (!isNaN(skip)) {
        file += skip;
      } else {
        const sq = sqOf(file, rank);
        const [color, piece] = charToColorPiece(ch);
        pieces[color][piece] |= 1n << BigInt(sq);
        file++;
      }
    }
  }

  const turn: Color = parts[1] === "w" ? Color.White : Color.Black;

  let castling = 0;
  const castStr = parts[2] ?? "-";
  if (castStr !== "-") {
    if (castStr.includes("K")) castling |= CastleFlag.WK;
    if (castStr.includes("Q")) castling |= CastleFlag.WQ;
    if (castStr.includes("k")) castling |= CastleFlag.BK;
    if (castStr.includes("q")) castling |= CastleFlag.BQ;
  }

  let enPassant: Square | -1 = -1;
  const epStr = parts[3] ?? "-";
  if (epStr !== "-") {
    enPassant = SQ_INDEX[epStr] ?? -1;
  }

  const halfmove = parseInt(parts[4] ?? "0", 10);
  const fullmove = parseInt(parts[5] ?? "1", 10);

  return { pieces, turn, castling, enPassant, halfmove, fullmove };
}

const PIECE_UPPER = "PNBRQK";

export function serializeFen(b: ChessBoard): string {
  let fenBoard = "";
  for (let r = 7; r >= 0; r--) {
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const sq = sqOf(f, r);
      const info = b.pieceAt(sq);
      if (info === null) {
        empty++;
      } else {
        if (empty > 0) {
          fenBoard += empty;
          empty = 0;
        }
        const ch = PIECE_UPPER[info.piece];
        fenBoard += info.color === Color.White ? ch : ch.toLowerCase();
      }
    }
    if (empty > 0) fenBoard += empty;
    if (r > 0) fenBoard += "/";
  }

  const turn = b.turn === Color.White ? "w" : "b";

  let castling = "";
  if (b.castling & CastleFlag.WK) castling += "K";
  if (b.castling & CastleFlag.WQ) castling += "Q";
  if (b.castling & CastleFlag.BK) castling += "k";
  if (b.castling & CastleFlag.BQ) castling += "q";
  if (castling === "") castling = "-";

  const ep = b.enPassant === -1 ? "-" : SQ_NAMES[b.enPassant];

  return `${fenBoard} ${turn} ${castling} ${ep} ${b.halfmove} ${b.fullmove}`;
}

export function loadFen(b: ChessBoard, fen: string): void {
  const state = parseFen(fen);
  for (let c = 0; c < 2; c++) {
    for (let p = 0; p < 8; p++) {
      b.pieces[c][p] = state.pieces[c][p] ?? 0n;
    }
  }
  b.turn = state.turn;
  b.castling = state.castling;
  b.enPassant = state.enPassant;
  b.halfmove = state.halfmove;
  b.fullmove = state.fullmove;
  b.history = [];
  b.rebuildOccupied();
  b.recomputeHash();
}
