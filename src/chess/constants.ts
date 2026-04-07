import type { Bitboard, Square } from "./types";

export const sqBB = (s: Square): Bitboard => 1n << BigInt(s);
export const fileOf = (s: Square): number => s & 7;
export const rankOf = (s: Square): number => s >> 3;
export const sqOf = (file: number, rank: number): Square => rank * 8 + file;

export const SQ_NAMES: string[] = [];
export const SQ_INDEX: Record<string, Square> = {};

for (let rank = 0; rank < 8; rank++) {
  for (let file = 0; file < 8; file++) {
    const name = String.fromCharCode(97 + file) + (rank + 1);
    const sq = rank * 8 + file;
    SQ_NAMES[sq] = name;
    SQ_INDEX[name] = sq;
  }
}

export const BB_EMPTY = 0n;
export const BB_FULL = 0xffff_ffff_ffff_ffffn;

export const FILE_A = 0x0101010101010101n;
export const FILE_B = FILE_A << 1n;
export const FILE_C = FILE_A << 2n;
export const FILE_D = FILE_A << 3n;
export const FILE_E = FILE_A << 4n;
export const FILE_F = FILE_A << 5n;
export const FILE_G = FILE_A << 6n;
export const FILE_H = 0x8080808080808080n;

export const NOT_FILE_A = ~FILE_A & BB_FULL;
export const NOT_FILE_H = ~FILE_H & BB_FULL;
export const NOT_FILE_AB = NOT_FILE_A & ~FILE_B & BB_FULL;
export const NOT_FILE_GH = NOT_FILE_H & ~FILE_G & BB_FULL;

export const RANK_1 = 0x00000000000000ffn;
export const RANK_2 = RANK_1 << 8n;
export const RANK_3 = RANK_1 << 16n;
export const RANK_4 = RANK_1 << 24n;
export const RANK_5 = RANK_1 << 32n;
export const RANK_6 = RANK_1 << 40n;
export const RANK_7 = RANK_1 << 48n;
export const RANK_8 = 0xff00000000000000n;

export const RANK_MASKS: Bitboard[] = [RANK_1, RANK_2, RANK_3, RANK_4, RANK_5, RANK_6, RANK_7, RANK_8];
export const FILE_MASKS: Bitboard[] = [FILE_A, FILE_B, FILE_C, FILE_D, FILE_E, FILE_F, FILE_G, FILE_H];

export const DIAG_MASKS: Bitboard[] = Array.from({ length: 64 });
export const ANTI_DIAG_MASKS: Bitboard[] = Array.from({ length: 64 });

for (let sq = 0; sq < 64; sq++) {
  const file = sq & 7;
  const rank = sq >> 3;

  let diag = 0n;
  for (let r = 0; r < 8; r++) {
    const f = file + (r - rank);
    if (f >= 0 && f < 8) diag |= 1n << BigInt(r * 8 + f);
  }
  DIAG_MASKS[sq] = diag;

  let anti = 0n;
  for (let r = 0; r < 8; r++) {
    const f = file - (r - rank);
    if (f >= 0 && f < 8) anti |= 1n << BigInt(r * 8 + f);
  }
  ANTI_DIAG_MASKS[sq] = anti;
}
