import { isAttacked } from "./attacks";
import { sqBB } from "./constants";
import type { Bitboard, Color, Move, Piece, Square } from "./types";
import { MoveFlags } from "./types";

export const CastleFlag = { WK: 1, WQ: 2, BK: 4, BQ: 8 } as const;

const CASTLING_MASK: number[] = new Array(64).fill(0b1111);
CASTLING_MASK[0] &= ~CastleFlag.WQ;
CASTLING_MASK[7] &= ~CastleFlag.WK;
CASTLING_MASK[4] &= ~(CastleFlag.WK | CastleFlag.WQ);
CASTLING_MASK[56] &= ~CastleFlag.BQ;
CASTLING_MASK[63] &= ~CastleFlag.BK;
CASTLING_MASK[60] &= ~(CastleFlag.BK | CastleFlag.BQ);

// Zobrist tables — seeded deterministically via splitmix32
function splitmix32(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x9e3779b9) | 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
    x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
    return (x ^ (x >>> 16)) >>> 0;
  };
}

const _rng = splitmix32(0xdeadbeef);
const _rng32 = () => _rng();

function makeZobristTable(size: number): [number[], number[]] {
  const lo = new Array<number>(size);
  const hi = new Array<number>(size);
  for (let i = 0; i < size; i++) {
    lo[i] = _rng32();
    hi[i] = _rng32();
  }
  return [lo, hi];
}

// piece[color][piece][square] — flattened: index = color*6*64 + piece*64 + square
const [ZPC_LO, ZPC_HI] = makeZobristTable(2 * 6 * 64);
// castling[castling bitmask 0–15]
const [ZCAST_LO, ZCAST_HI] = makeZobristTable(16);
// en passant file[0–7]
const [ZEP_LO, ZEP_HI] = makeZobristTable(8);
// side to move (black to move XORs this in)
const [ZSIDE_LO, ZSIDE_HI] = makeZobristTable(1);

function zpcIdx(color: Color, piece: Piece, sq: Square): number {
  return color * 6 * 64 + piece * 64 + sq;
}

type HistoryEntry = {
  move: Move;
  castling: number;
  enPassant: Square | -1;
  halfmove: number;
  hashLo: number;
  hashHi: number;
};

export class ChessBoard {
  pieces: [Bitboard[], Bitboard[]];
  occupied: [Bitboard, Bitboard];
  turn: Color;
  castling: number;
  enPassant: Square | -1;
  halfmove: number;
  fullmove: number;
  history: HistoryEntry[];
  hashLo: number;
  hashHi: number;

  constructor() {
    this.pieces = [new Array(8).fill(0n), new Array(8).fill(0n)];
    this.occupied = [0n, 0n];
    this.turn = 1; // White
    this.castling = 0;
    this.enPassant = -1;
    this.halfmove = 0;
    this.fullmove = 1;
    this.history = [];
    this.hashLo = 0;
    this.hashHi = 0;
  }

  allOccupied(): Bitboard {
    return this.occupied[0] | this.occupied[1];
  }

  pieceAt(sq: Square): { piece: Piece; color: Color } | null {
    const bit = sqBB(sq);
    for (let c = 0; c < 2; c++) {
      for (let p = 0; p < 6; p++) {
        if (this.pieces[c][p] & bit) {
          return { piece: p as Piece, color: c as Color };
        }
      }
    }
    return null;
  }

  rebuildOccupied(): void {
    this.occupied[0] = 0n;
    this.occupied[1] = 0n;
    for (let p = 0; p < 6; p++) {
      this.occupied[0] |= this.pieces[0][p];
      this.occupied[1] |= this.pieces[1][p];
    }
  }

  recomputeHash(): void {
    this.hashLo = 0;
    this.hashHi = 0;
    for (let c = 0; c < 2; c++) {
      for (let p = 0; p < 6; p++) {
        let bb = this.pieces[c][p];
        while (bb) {
          const loBits = Number(bb & 0xffffffffn);
          let sq: number;
          if (loBits) {
            const lsb = loBits & -loBits;
            sq = 31 - Math.clz32(lsb);
          } else {
            const hiBits = Number((bb >> 32n) & 0xffffffffn);
            const lsb = hiBits & -hiBits;
            sq = 32 + 31 - Math.clz32(lsb);
          }
          const idx = zpcIdx(c as Color, p as Piece, sq);
          this.hashLo ^= ZPC_LO[idx];
          this.hashHi ^= ZPC_HI[idx];
          bb &= bb - 1n;
        }
      }
    }
    this.hashLo ^= ZCAST_LO[this.castling];
    this.hashHi ^= ZCAST_HI[this.castling];
    if (this.enPassant !== -1) {
      const file = this.enPassant & 7;
      this.hashLo ^= ZEP_LO[file];
      this.hashHi ^= ZEP_HI[file];
    }
    if (this.turn === 0) {
      this.hashLo ^= ZSIDE_LO[0];
      this.hashHi ^= ZSIDE_HI[0];
    }
  }

  makeMove(move: Move): void {
    const { from, to, piece, color, captured, promotion, flags } = move;
    const opp = (color ^ 1) as Color;

    this.history.push({
      move,
      castling: this.castling,
      enPassant: this.enPassant,
      halfmove: this.halfmove,
      hashLo: this.hashLo,
      hashHi: this.hashHi,
    });

    // Zobrist: undo old castling and ep
    this.hashLo ^= ZCAST_LO[this.castling];
    this.hashHi ^= ZCAST_HI[this.castling];
    if (this.enPassant !== -1) {
      this.hashLo ^= ZEP_LO[this.enPassant & 7];
      this.hashHi ^= ZEP_HI[this.enPassant & 7];
    }
    // Undo side hash (we'll re-add for the new side at the end)
    this.hashLo ^= ZSIDE_LO[0];
    this.hashHi ^= ZSIDE_HI[0];

    const fromBB = sqBB(from);
    const toBB = sqBB(to);
    const fromToBB = fromBB | toBB;

    // Move piece
    this.pieces[color][piece] ^= fromToBB;
    this.occupied[color] ^= fromToBB;
    this.hashLo ^= ZPC_LO[zpcIdx(color, piece, from)] ^ ZPC_LO[zpcIdx(color, piece, to)];
    this.hashHi ^= ZPC_HI[zpcIdx(color, piece, from)] ^ ZPC_HI[zpcIdx(color, piece, to)];

    // Capture
    if (flags & MoveFlags.Capture) {
      if (flags & MoveFlags.EnPassant) {
        const epSq = color === 1 ? to - 8 : to + 8;
        const epBB = sqBB(epSq);
        this.pieces[opp][captured] ^= epBB;
        this.occupied[opp] ^= epBB;
        this.hashLo ^= ZPC_LO[zpcIdx(opp, captured, epSq)];
        this.hashHi ^= ZPC_HI[zpcIdx(opp, captured, epSq)];
      } else {
        this.pieces[opp][captured] ^= toBB;
        this.occupied[opp] ^= toBB;
        this.hashLo ^= ZPC_LO[zpcIdx(opp, captured, to)];
        this.hashHi ^= ZPC_HI[zpcIdx(opp, captured, to)];
      }
    }

    // Promotion
    if (flags & MoveFlags.Promotion) {
      // Remove pawn at `to`, add promoted piece at `to`
      this.pieces[color][piece] ^= toBB; // remove pawn
      this.pieces[color][promotion] ^= toBB; // add promoted piece
      this.hashLo ^= ZPC_LO[zpcIdx(color, piece, to)] ^ ZPC_LO[zpcIdx(color, promotion, to)];
      this.hashHi ^= ZPC_HI[zpcIdx(color, piece, to)] ^ ZPC_HI[zpcIdx(color, promotion, to)];
    }

    // Castling rook move
    if (flags & MoveFlags.CastleKing) {
      if (color === 1) {
        // wK: h1(7) -> f1(5)
        this.pieces[color][3] ^= sqBB(7) | sqBB(5);
        this.occupied[color] ^= sqBB(7) | sqBB(5);
        this.hashLo ^= ZPC_LO[zpcIdx(color, 3, 7)] ^ ZPC_LO[zpcIdx(color, 3, 5)];
        this.hashHi ^= ZPC_HI[zpcIdx(color, 3, 7)] ^ ZPC_HI[zpcIdx(color, 3, 5)];
      } else {
        // bK: h8(63) -> f8(61)
        this.pieces[color][3] ^= sqBB(63) | sqBB(61);
        this.occupied[color] ^= sqBB(63) | sqBB(61);
        this.hashLo ^= ZPC_LO[zpcIdx(color, 3, 63)] ^ ZPC_LO[zpcIdx(color, 3, 61)];
        this.hashHi ^= ZPC_HI[zpcIdx(color, 3, 63)] ^ ZPC_HI[zpcIdx(color, 3, 61)];
      }
    } else if (flags & MoveFlags.CastleQueen) {
      if (color === 1) {
        // wQ: a1(0) -> d1(3)
        this.pieces[color][3] ^= sqBB(0) | sqBB(3);
        this.occupied[color] ^= sqBB(0) | sqBB(3);
        this.hashLo ^= ZPC_LO[zpcIdx(color, 3, 0)] ^ ZPC_LO[zpcIdx(color, 3, 3)];
        this.hashHi ^= ZPC_HI[zpcIdx(color, 3, 0)] ^ ZPC_HI[zpcIdx(color, 3, 3)];
      } else {
        // bQ: a8(56) -> d8(59)
        this.pieces[color][3] ^= sqBB(56) | sqBB(59);
        this.occupied[color] ^= sqBB(56) | sqBB(59);
        this.hashLo ^= ZPC_LO[zpcIdx(color, 3, 56)] ^ ZPC_LO[zpcIdx(color, 3, 59)];
        this.hashHi ^= ZPC_HI[zpcIdx(color, 3, 56)] ^ ZPC_HI[zpcIdx(color, 3, 59)];
      }
    }

    // En passant square
    if (flags & MoveFlags.DoublePush) {
      this.enPassant = color === 1 ? from + 8 : from - 8;
      this.hashLo ^= ZEP_LO[this.enPassant & 7];
      this.hashHi ^= ZEP_HI[this.enPassant & 7];
    } else {
      this.enPassant = -1;
    }

    // Castling rights
    this.castling &= CASTLING_MASK[from] & CASTLING_MASK[to];
    this.hashLo ^= ZCAST_LO[this.castling];
    this.hashHi ^= ZCAST_HI[this.castling];

    // Halfmove clock
    if (flags & MoveFlags.Capture || piece === 0) {
      this.halfmove = 0;
    } else {
      this.halfmove++;
    }

    // Fullmove
    if (color === 0) this.fullmove++;

    // Side to move
    this.turn = opp;
    if (this.turn === 0) {
      this.hashLo ^= ZSIDE_LO[0];
      this.hashHi ^= ZSIDE_HI[0];
    }
  }

  unmakeMove(): Move | undefined {
    const entry = this.history.pop();
    if (!entry) return undefined;

    const { move, castling, enPassant, halfmove, hashLo, hashHi } = entry;
    const { from, to, piece, color, captured, promotion, flags } = move;
    const opp = (color ^ 1) as Color;

    const fromBB = sqBB(from);
    const toBB = sqBB(to);
    const fromToBB = fromBB | toBB;

    // Promotion: remove promoted piece at `to`, restore pawn at `to`
    if (flags & MoveFlags.Promotion) {
      this.pieces[color][promotion] ^= toBB;
      this.pieces[color][piece] ^= toBB;
    }

    // Move piece back
    this.pieces[color][piece] ^= fromToBB;
    this.occupied[color] ^= fromToBB;

    // Restore capture
    if (flags & MoveFlags.Capture) {
      if (flags & MoveFlags.EnPassant) {
        const epSq = color === 1 ? to - 8 : to + 8;
        const epBB = sqBB(epSq);
        this.pieces[opp][captured] ^= epBB;
        this.occupied[opp] ^= epBB;
      } else {
        this.pieces[opp][captured] ^= toBB;
        this.occupied[opp] ^= toBB;
      }
    }

    // Restore castling rook
    if (flags & MoveFlags.CastleKing) {
      if (color === 1) {
        this.pieces[color][3] ^= sqBB(7) | sqBB(5);
        this.occupied[color] ^= sqBB(7) | sqBB(5);
      } else {
        this.pieces[color][3] ^= sqBB(63) | sqBB(61);
        this.occupied[color] ^= sqBB(63) | sqBB(61);
      }
    } else if (flags & MoveFlags.CastleQueen) {
      if (color === 1) {
        this.pieces[color][3] ^= sqBB(0) | sqBB(3);
        this.occupied[color] ^= sqBB(0) | sqBB(3);
      } else {
        this.pieces[color][3] ^= sqBB(56) | sqBB(59);
        this.occupied[color] ^= sqBB(56) | sqBB(59);
      }
    }

    // Restore occupied for promotion (pawn moved, so occupied was toggled via piece move above)
    // occupied is already correct since we toggled fromToBB; promotion only swaps piece type, not square

    this.turn = color;
    this.castling = castling;
    this.enPassant = enPassant;
    this.halfmove = halfmove;
    if (color === 0) this.fullmove--;
    this.hashLo = hashLo;
    this.hashHi = hashHi;

    return move;
  }
}

export { ZPC_LO, ZPC_HI, ZCAST_LO, ZCAST_HI, ZEP_LO, ZEP_HI, ZSIDE_LO, ZSIDE_HI, zpcIdx, isAttacked };
