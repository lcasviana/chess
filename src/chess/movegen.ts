import { KING_ATTACKS, KNIGHT_ATTACKS, PAWN_ATTACKS, bishopAttacks, isAttacked, rookAttacks } from "./attacks";
import { CastleFlag } from "./board";
import type { ChessBoard } from "./board";
import { RANK_1, RANK_2, RANK_4, RANK_5, RANK_7, RANK_8, sqBB } from "./constants";
import { MoveFlags, Piece } from "./types";
import type { Bitboard, Color, Move, Square } from "./types";

function lsb(bb: Bitboard): Square {
  const lo = Number(bb & 0xffffffffn);
  if (lo) return 31 - Math.clz32(lo & -lo);
  const hi = Number((bb >> 32n) & 0xffffffffn);
  return 32 + 31 - Math.clz32(hi & -hi);
}

function popLSB(bb: Bitboard): [Square, Bitboard] {
  return [lsb(bb), bb & (bb - 1n)];
}

const MOVE_POOL: Move[] = Array.from({ length: 256 });
let moveCount = 0;

function push(from: Square, to: Square, piece: Piece, color: Color, captured: Piece, promotion: Piece, flags: number): void {
  MOVE_POOL[moveCount++] = { from, to, piece, color, captured, promotion, flags };
}

function generatePseudoLegal(b: ChessBoard, moves: Move[]): void {
  moveCount = 0;
  const color = b.turn;
  const opp = (color ^ 1) as Color;
  const friendly = b.occupied[color];
  const enemy = b.occupied[opp];
  const allOcc = friendly | enemy;
  const empty = ~allOcc;

  // Pawns
  {
    let pawns = b.pieces[color][Piece.Pawn];
    if (color === 1) {
      // White
      const singlePush = (pawns << 8n) & empty & ~RANK_8;
      const doublePush = ((((pawns & RANK_2) << 8n) & empty) << 8n) & empty & RANK_4;
      const promoPush = (pawns << 8n) & empty & RANK_8;

      let bb = singlePush;
      while (bb) {
        const [to, rest] = popLSB(bb);
        push(to - 8, to, Piece.Pawn, color, Piece.None, Piece.None, MoveFlags.Normal);
        bb = rest;
      }

      bb = doublePush;
      while (bb) {
        const [to, rest] = popLSB(bb);
        push(to - 16, to, Piece.Pawn, color, Piece.None, Piece.None, MoveFlags.DoublePush);
        bb = rest;
      }

      bb = promoPush;
      while (bb) {
        const [to, rest] = popLSB(bb);
        const from = to - 8;
        push(from, to, Piece.Pawn, color, Piece.None, Piece.Queen, MoveFlags.Promotion);
        push(from, to, Piece.Pawn, color, Piece.None, Piece.Rook, MoveFlags.Promotion);
        push(from, to, Piece.Pawn, color, Piece.None, Piece.Bishop, MoveFlags.Promotion);
        push(from, to, Piece.Pawn, color, Piece.None, Piece.Knight, MoveFlags.Promotion);
        bb = rest;
      }

      // Captures
      while (pawns) {
        const [sq, rest] = popLSB(pawns);
        pawns = rest;
        const attacks = PAWN_ATTACKS[color][sq] & enemy;
        let atk = attacks & ~RANK_8;
        while (atk) {
          const [to, r] = popLSB(atk);
          const cap = pieceOnSquare(b, opp, to);
          push(sq, to, Piece.Pawn, color, cap, Piece.None, MoveFlags.Capture);
          atk = r;
        }
        let promoAtk = attacks & RANK_8;
        while (promoAtk) {
          const [to, r] = popLSB(promoAtk);
          const cap = pieceOnSquare(b, opp, to);
          push(sq, to, Piece.Pawn, color, cap, Piece.Queen, MoveFlags.Capture | MoveFlags.Promotion);
          push(sq, to, Piece.Pawn, color, cap, Piece.Rook, MoveFlags.Capture | MoveFlags.Promotion);
          push(sq, to, Piece.Pawn, color, cap, Piece.Bishop, MoveFlags.Capture | MoveFlags.Promotion);
          push(sq, to, Piece.Pawn, color, cap, Piece.Knight, MoveFlags.Capture | MoveFlags.Promotion);
          promoAtk = r;
        }
        // En passant
        if (b.enPassant !== -1) {
          const epBB = sqBB(b.enPassant);
          if (PAWN_ATTACKS[color][sq] & epBB) {
            push(sq, b.enPassant, Piece.Pawn, color, Piece.Pawn, Piece.None, MoveFlags.Capture | MoveFlags.EnPassant);
          }
        }
      }
    } else {
      // Black
      const singlePush = (pawns >> 8n) & empty & ~RANK_1;
      const doublePush = ((((pawns & RANK_7) >> 8n) & empty) >> 8n) & empty & RANK_5;
      const promoPush = (pawns >> 8n) & empty & RANK_1;

      let bb = singlePush;
      while (bb) {
        const [to, rest] = popLSB(bb);
        push(to + 8, to, Piece.Pawn, color, Piece.None, Piece.None, MoveFlags.Normal);
        bb = rest;
      }

      bb = doublePush;
      while (bb) {
        const [to, rest] = popLSB(bb);
        push(to + 16, to, Piece.Pawn, color, Piece.None, Piece.None, MoveFlags.DoublePush);
        bb = rest;
      }

      bb = promoPush;
      while (bb) {
        const [to, rest] = popLSB(bb);
        const from = to + 8;
        push(from, to, Piece.Pawn, color, Piece.None, Piece.Queen, MoveFlags.Promotion);
        push(from, to, Piece.Pawn, color, Piece.None, Piece.Rook, MoveFlags.Promotion);
        push(from, to, Piece.Pawn, color, Piece.None, Piece.Bishop, MoveFlags.Promotion);
        push(from, to, Piece.Pawn, color, Piece.None, Piece.Knight, MoveFlags.Promotion);
        bb = rest;
      }

      while (pawns) {
        const [sq, rest] = popLSB(pawns);
        pawns = rest;
        const attacks = PAWN_ATTACKS[color][sq] & enemy;
        let atk = attacks & ~RANK_1;
        while (atk) {
          const [to, r] = popLSB(atk);
          const cap = pieceOnSquare(b, opp, to);
          push(sq, to, Piece.Pawn, color, cap, Piece.None, MoveFlags.Capture);
          atk = r;
        }
        let promoAtk = attacks & RANK_1;
        while (promoAtk) {
          const [to, r] = popLSB(promoAtk);
          const cap = pieceOnSquare(b, opp, to);
          push(sq, to, Piece.Pawn, color, cap, Piece.Queen, MoveFlags.Capture | MoveFlags.Promotion);
          push(sq, to, Piece.Pawn, color, cap, Piece.Rook, MoveFlags.Capture | MoveFlags.Promotion);
          push(sq, to, Piece.Pawn, color, cap, Piece.Bishop, MoveFlags.Capture | MoveFlags.Promotion);
          push(sq, to, Piece.Pawn, color, cap, Piece.Knight, MoveFlags.Capture | MoveFlags.Promotion);
          promoAtk = r;
        }
        if (b.enPassant !== -1) {
          const epBB = sqBB(b.enPassant);
          if (PAWN_ATTACKS[color][sq] & epBB) {
            push(sq, b.enPassant, Piece.Pawn, color, Piece.Pawn, Piece.None, MoveFlags.Capture | MoveFlags.EnPassant);
          }
        }
      }
    }
  }

  // Knights
  {
    let knights = b.pieces[color][Piece.Knight];
    while (knights) {
      const [sq, rest] = popLSB(knights);
      knights = rest;
      let targets = KNIGHT_ATTACKS[sq] & ~friendly;
      while (targets) {
        const [to, r] = popLSB(targets);
        targets = r;
        const isCapture = !!(sqBB(to) & enemy);
        const cap = isCapture ? pieceOnSquare(b, opp, to) : Piece.None;
        push(sq, to, Piece.Knight, color, cap, Piece.None, isCapture ? MoveFlags.Capture : MoveFlags.Normal);
      }
    }
  }

  // Bishops
  {
    let bishops = b.pieces[color][Piece.Bishop];
    while (bishops) {
      const [sq, rest] = popLSB(bishops);
      bishops = rest;
      let targets = bishopAttacks(sq, allOcc) & ~friendly;
      while (targets) {
        const [to, r] = popLSB(targets);
        targets = r;
        const isCapture = !!(sqBB(to) & enemy);
        const cap = isCapture ? pieceOnSquare(b, opp, to) : Piece.None;
        push(sq, to, Piece.Bishop, color, cap, Piece.None, isCapture ? MoveFlags.Capture : MoveFlags.Normal);
      }
    }
  }

  // Rooks
  {
    let rooks = b.pieces[color][Piece.Rook];
    while (rooks) {
      const [sq, rest] = popLSB(rooks);
      rooks = rest;
      let targets = rookAttacks(sq, allOcc) & ~friendly;
      while (targets) {
        const [to, r] = popLSB(targets);
        targets = r;
        const isCapture = !!(sqBB(to) & enemy);
        const cap = isCapture ? pieceOnSquare(b, opp, to) : Piece.None;
        push(sq, to, Piece.Rook, color, cap, Piece.None, isCapture ? MoveFlags.Capture : MoveFlags.Normal);
      }
    }
  }

  // Queens
  {
    let queens = b.pieces[color][Piece.Queen];
    while (queens) {
      const [sq, rest] = popLSB(queens);
      queens = rest;
      let targets = (rookAttacks(sq, allOcc) | bishopAttacks(sq, allOcc)) & ~friendly;
      while (targets) {
        const [to, r] = popLSB(targets);
        targets = r;
        const isCapture = !!(sqBB(to) & enemy);
        const cap = isCapture ? pieceOnSquare(b, opp, to) : Piece.None;
        push(sq, to, Piece.Queen, color, cap, Piece.None, isCapture ? MoveFlags.Capture : MoveFlags.Normal);
      }
    }
  }

  // King
  {
    let kings = b.pieces[color][Piece.King];
    while (kings) {
      const [sq, rest] = popLSB(kings);
      kings = rest;
      let targets = KING_ATTACKS[sq] & ~friendly;
      while (targets) {
        const [to, r] = popLSB(targets);
        targets = r;
        const isCapture = !!(sqBB(to) & enemy);
        const cap = isCapture ? pieceOnSquare(b, opp, to) : Piece.None;
        push(sq, to, Piece.King, color, cap, Piece.None, isCapture ? MoveFlags.Capture : MoveFlags.Normal);
      }
    }
  }

  for (let i = 0; i < moveCount; i++) {
    moves.push(MOVE_POOL[i]);
  }
}

function pieceOnSquare(b: ChessBoard, color: Color, sq: Square): Piece {
  const bit = sqBB(sq);
  for (let p = 0; p < 6; p++) {
    if (b.pieces[color][p] & bit) return p as Piece;
  }
  return Piece.None;
}

function generateCastling(b: ChessBoard, allOcc: Bitboard, moves: Move[]): void {
  const color = b.turn;
  const opp = (color ^ 1) as Color;

  if (color === 1) {
    // White kingside: e1(4)->g1(6), f1(5) must be empty+safe, h1(7) rook present
    if (
      b.castling & CastleFlag.WK &&
      !(allOcc & (sqBB(5) | sqBB(6))) &&
      !isAttacked(4, opp, b, allOcc) &&
      !isAttacked(5, opp, b, allOcc) &&
      !isAttacked(6, opp, b, allOcc)
    ) {
      moves.push({ from: 4, to: 6, piece: Piece.King, color, captured: Piece.None, promotion: Piece.None, flags: MoveFlags.CastleKing });
    }
    // White queenside: e1(4)->c1(2), b1(1),c1(2),d1(3) empty, d1(3)+c1(2) safe
    if (
      b.castling & CastleFlag.WQ &&
      !(allOcc & (sqBB(1) | sqBB(2) | sqBB(3))) &&
      !isAttacked(4, opp, b, allOcc) &&
      !isAttacked(3, opp, b, allOcc) &&
      !isAttacked(2, opp, b, allOcc)
    ) {
      moves.push({ from: 4, to: 2, piece: Piece.King, color, captured: Piece.None, promotion: Piece.None, flags: MoveFlags.CastleQueen });
    }
  } else {
    // Black kingside: e8(60)->g8(62)
    if (
      b.castling & CastleFlag.BK &&
      !(allOcc & (sqBB(61) | sqBB(62))) &&
      !isAttacked(60, opp, b, allOcc) &&
      !isAttacked(61, opp, b, allOcc) &&
      !isAttacked(62, opp, b, allOcc)
    ) {
      moves.push({ from: 60, to: 62, piece: Piece.King, color, captured: Piece.None, promotion: Piece.None, flags: MoveFlags.CastleKing });
    }
    // Black queenside: e8(60)->c8(58)
    if (
      b.castling & CastleFlag.BQ &&
      !(allOcc & (sqBB(57) | sqBB(58) | sqBB(59))) &&
      !isAttacked(60, opp, b, allOcc) &&
      !isAttacked(59, opp, b, allOcc) &&
      !isAttacked(58, opp, b, allOcc)
    ) {
      moves.push({ from: 60, to: 58, piece: Piece.King, color, captured: Piece.None, promotion: Piece.None, flags: MoveFlags.CastleQueen });
    }
  }
}

export function generateLegal(b: ChessBoard): Move[] {
  const pseudo: Move[] = [];
  generatePseudoLegal(b, pseudo);

  const allOcc = b.allOccupied();
  generateCastling(b, allOcc, pseudo);

  const color = b.turn;
  const opp = (color ^ 1) as Color;
  const legal: Move[] = [];

  for (const move of pseudo) {
    b.makeMove(move);
    const newOcc = b.allOccupied();
    const kingSq = lsb(b.pieces[color][Piece.King]);
    if (!isAttacked(kingSq, opp, b, newOcc)) {
      legal.push(move);
    }
    b.unmakeMove();
  }

  return legal;
}

export function legalMovesFrom(b: ChessBoard, sq: Square): Move[] {
  return generateLegal(b).filter((m) => m.from === sq);
}

export { lsb, popLSB };
