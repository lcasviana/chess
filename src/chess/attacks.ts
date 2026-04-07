import { BB_FULL, NOT_FILE_A, NOT_FILE_AB, NOT_FILE_GH, NOT_FILE_H, sqBB } from "./constants";
import { Color, Piece } from "./types";
import type { Bitboard, Square } from "./types";

export const KNIGHT_ATTACKS: Bitboard[] = Array.from({ length: 64 });
export const KING_ATTACKS: Bitboard[] = Array.from({ length: 64 });
export const PAWN_ATTACKS: [Bitboard[], Bitboard[]] = [Array.from({ length: 64 }), Array.from({ length: 64 })];

for (let s = 0; s < 64; s++) {
  const b = sqBB(s);

  KNIGHT_ATTACKS[s] =
    ((b << 17n) & NOT_FILE_A) |
    ((b << 15n) & NOT_FILE_H) |
    ((b << 10n) & NOT_FILE_AB) |
    ((b << 6n) & NOT_FILE_GH) |
    ((b >> 17n) & NOT_FILE_H) |
    ((b >> 15n) & NOT_FILE_A) |
    ((b >> 10n) & NOT_FILE_GH) |
    ((b >> 6n) & NOT_FILE_AB);

  PAWN_ATTACKS[Color.White][s] = ((b << 9n) & NOT_FILE_A) | ((b << 7n) & NOT_FILE_H);
  PAWN_ATTACKS[Color.Black][s] = ((b >> 9n) & NOT_FILE_H) | ((b >> 7n) & NOT_FILE_A);

  KING_ATTACKS[s] =
    ((b << 8n) & BB_FULL) |
    (b >> 8n) |
    ((b << 1n) & NOT_FILE_A) |
    ((b >> 1n) & NOT_FILE_H) |
    ((b << 9n) & NOT_FILE_A) |
    ((b << 7n) & NOT_FILE_H) |
    ((b >> 7n) & NOT_FILE_A) |
    ((b >> 9n) & NOT_FILE_H);
}

function fillNorth(gen: Bitboard, occ: Bitboard): Bitboard {
  const empty = ~occ & BB_FULL;
  gen |= (gen << 8n) & empty;
  gen |= (gen << 8n) & empty;
  gen |= (gen << 8n) & empty;
  gen |= (gen << 8n) & empty;
  gen |= (gen << 8n) & empty;
  gen |= (gen << 8n) & empty;
  return (gen << 8n) & BB_FULL;
}

function fillSouth(gen: Bitboard, occ: Bitboard): Bitboard {
  const empty = ~occ & BB_FULL;
  gen |= (gen >> 8n) & empty;
  gen |= (gen >> 8n) & empty;
  gen |= (gen >> 8n) & empty;
  gen |= (gen >> 8n) & empty;
  gen |= (gen >> 8n) & empty;
  gen |= (gen >> 8n) & empty;
  return gen >> 8n;
}

function fillEast(gen: Bitboard, occ: Bitboard): Bitboard {
  const empty = ~occ & BB_FULL & NOT_FILE_A;
  gen |= (gen << 1n) & empty;
  gen |= (gen << 1n) & empty;
  gen |= (gen << 1n) & empty;
  gen |= (gen << 1n) & empty;
  gen |= (gen << 1n) & empty;
  gen |= (gen << 1n) & empty;
  return (gen << 1n) & NOT_FILE_A;
}

function fillWest(gen: Bitboard, occ: Bitboard): Bitboard {
  const empty = ~occ & BB_FULL & NOT_FILE_H;
  gen |= (gen >> 1n) & empty;
  gen |= (gen >> 1n) & empty;
  gen |= (gen >> 1n) & empty;
  gen |= (gen >> 1n) & empty;
  gen |= (gen >> 1n) & empty;
  gen |= (gen >> 1n) & empty;
  return (gen >> 1n) & NOT_FILE_H;
}

function fillNE(gen: Bitboard, occ: Bitboard): Bitboard {
  const empty = ~occ & BB_FULL & NOT_FILE_A;
  gen |= (gen << 9n) & empty;
  gen |= (gen << 9n) & empty;
  gen |= (gen << 9n) & empty;
  gen |= (gen << 9n) & empty;
  gen |= (gen << 9n) & empty;
  gen |= (gen << 9n) & empty;
  return (gen << 9n) & NOT_FILE_A;
}

function fillNW(gen: Bitboard, occ: Bitboard): Bitboard {
  const empty = ~occ & BB_FULL & NOT_FILE_H;
  gen |= (gen << 7n) & empty;
  gen |= (gen << 7n) & empty;
  gen |= (gen << 7n) & empty;
  gen |= (gen << 7n) & empty;
  gen |= (gen << 7n) & empty;
  gen |= (gen << 7n) & empty;
  return (gen << 7n) & NOT_FILE_H;
}

function fillSE(gen: Bitboard, occ: Bitboard): Bitboard {
  const empty = ~occ & BB_FULL & NOT_FILE_A;
  gen |= (gen >> 7n) & empty;
  gen |= (gen >> 7n) & empty;
  gen |= (gen >> 7n) & empty;
  gen |= (gen >> 7n) & empty;
  gen |= (gen >> 7n) & empty;
  gen |= (gen >> 7n) & empty;
  return (gen >> 7n) & NOT_FILE_A;
}

function fillSW(gen: Bitboard, occ: Bitboard): Bitboard {
  const empty = ~occ & BB_FULL & NOT_FILE_H;
  gen |= (gen >> 9n) & empty;
  gen |= (gen >> 9n) & empty;
  gen |= (gen >> 9n) & empty;
  gen |= (gen >> 9n) & empty;
  gen |= (gen >> 9n) & empty;
  gen |= (gen >> 9n) & empty;
  return (gen >> 9n) & NOT_FILE_H;
}

export function rookAttacks(sq: Square, occ: Bitboard): Bitboard {
  const b = sqBB(sq);
  return fillNorth(b, occ) | fillSouth(b, occ) | fillEast(b, occ) | fillWest(b, occ);
}

export function bishopAttacks(sq: Square, occ: Bitboard): Bitboard {
  const b = sqBB(sq);
  return fillNE(b, occ) | fillNW(b, occ) | fillSE(b, occ) | fillSW(b, occ);
}

export function queenAttacks(sq: Square, occ: Bitboard): Bitboard {
  return rookAttacks(sq, occ) | bishopAttacks(sq, occ);
}

export type AttackBoard = {
  pieces: [Bitboard[], Bitboard[]];
};

export function isAttacked(sq: Square, byColor: 0 | 1, board: AttackBoard, allOcc: Bitboard): boolean {
  const bp = board.pieces[byColor];

  if (KNIGHT_ATTACKS[sq] & bp[Piece.Knight]) return true;
  if (PAWN_ATTACKS[byColor ^ 1][sq] & bp[Piece.Pawn]) return true;
  if (KING_ATTACKS[sq] & bp[Piece.King]) return true;

  const diagAtk = bishopAttacks(sq, allOcc);
  if (diagAtk & (bp[Piece.Bishop] | bp[Piece.Queen])) return true;

  const orthAtk = rookAttacks(sq, allOcc);
  if (orthAtk & (bp[Piece.Rook] | bp[Piece.Queen])) return true;

  return false;
}
