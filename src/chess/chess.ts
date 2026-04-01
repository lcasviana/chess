import { isAttacked } from "./attacks";
import { ChessBoard } from "./board";
import { loadFen, serializeFen } from "./fen";
import { legalMovesFrom as _legalMovesFrom, generateLegal, lsb } from "./movegen";
import type { Color, Move, Piece, Square } from "./types";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export class ChessEngine {
  private b: ChessBoard;
  private hashCounts: Map<string, number>;

  constructor(fen?: string) {
    this.b = new ChessBoard();
    this.hashCounts = new Map();
    loadFen(this.b, fen ?? STARTING_FEN);
    this._recordHash();
  }

  load(fen: string): void {
    this.b = new ChessBoard();
    this.hashCounts = new Map();
    loadFen(this.b, fen);
    this._recordHash();
  }

  reset(): void {
    this.load(STARTING_FEN);
  }

  fen(): string {
    return serializeFen(this.b);
  }

  turn(): Color {
    return this.b.turn;
  }

  legalMoves(): Move[] {
    return generateLegal(this.b);
  }

  legalMovesFrom(sq: Square): Move[] {
    return _legalMovesFrom(this.b, sq);
  }

  makeMove(move: Move): void {
    this.b.makeMove(move);
    this._recordHash();
  }

  unmakeMove(): void {
    this._unrecordHash();
    this.b.unmakeMove();
  }

  isCheck(): boolean {
    const color = this.b.turn;
    const opp = (color ^ 1) as Color;
    const kingSq = lsb(this.b.pieces[color][5]);
    return isAttacked(kingSq, opp, this.b, this.b.allOccupied());
  }

  isCheckmate(): boolean {
    return this.isCheck() && generateLegal(this.b).length === 0;
  }

  isStalemate(): boolean {
    return !this.isCheck() && generateLegal(this.b).length === 0;
  }

  isDraw(): boolean {
    return this.isStalemate() || this.b.halfmove >= 100 || this.isThreefoldRepetition() || this.isInsufficientMaterial();
  }

  isThreefoldRepetition(): boolean {
    const key = this._hashKey();
    return (this.hashCounts.get(key) ?? 0) >= 3;
  }

  isInsufficientMaterial(): boolean {
    const b = this.b;
    const wPieces = b.pieces[1];
    const bPieces = b.pieces[0];

    const wPawns = wPieces[0];
    const bPawns = bPieces[0];
    const wRooks = wPieces[3];
    const bRooks = bPieces[3];
    const wQueens = wPieces[4];
    const bQueens = bPieces[4];

    if (wPawns || bPawns || wRooks || bRooks || wQueens || bQueens) return false;

    const wKnights = wPieces[1];
    const bKnights = bPieces[1];
    const wBishops = wPieces[2];
    const bBishops = bPieces[2];

    const wMinor = popcount(wKnights | wBishops);
    const bMinor = popcount(bKnights | bBishops);

    // K vs K
    if (wMinor === 0 && bMinor === 0) return true;
    // K+B vs K or K+N vs K
    if (wMinor === 1 && bMinor === 0) return true;
    if (bMinor === 1 && wMinor === 0) return true;
    // K+B vs K+B (same color squares)
    if (wMinor === 1 && bMinor === 1 && wBishops && bBishops) {
      const wBSq = lsb(wBishops);
      const bBSq = lsb(bBishops);
      if (((wBSq ^ bBSq) & 1) === 0) return true;
    }
    // K+N+N vs K
    if (wMinor === 2 && bMinor === 0 && !wBishops) return true;
    if (bMinor === 2 && wMinor === 0 && !bBishops) return true;

    return false;
  }

  pieceAt(sq: Square): { piece: Piece; color: Color } | null {
    return this.b.pieceAt(sq);
  }

  zobristHash(): bigint {
    return (BigInt(this.b.hashHi) << 32n) | BigInt(this.b.hashLo);
  }

  private _hashKey(): string {
    return this.b.hashHi.toString(16) + this.b.hashLo.toString(16);
  }

  private _recordHash(): void {
    const key = this._hashKey();
    this.hashCounts.set(key, (this.hashCounts.get(key) ?? 0) + 1);
  }

  private _unrecordHash(): void {
    const key = this._hashKey();
    const count = this.hashCounts.get(key) ?? 0;
    if (count <= 1) {
      this.hashCounts.delete(key);
    } else {
      this.hashCounts.set(key, count - 1);
    }
  }
}

function popcount(bb: bigint): number {
  let n = 0;
  while (bb) {
    bb &= bb - 1n;
    n++;
  }
  return n;
}
