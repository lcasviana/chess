import type { Chess, Color, PieceSymbol } from "chess.js";
import { PIECE_VALUES } from "~/utils/constants";

const scale = (tables: number[][][]) => tables.map((t) => t.map((r) => r.map((v) => v / 100)));

const [PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING_MG, KING_EG] = scale([
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
  ],
  [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ],
  [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50],
  ],
]);

const PST: Record<PieceSymbol, number[][]> = { p: PAWN, n: KNIGHT, b: BISHOP, r: ROOK, q: QUEEN, k: KING_MG };
const PST_EG: Record<PieceSymbol, number[][]> = { ...PST, k: KING_EG };

const WEIGHTS = [
  { mat: 1.0, pos: 0.3, ks: 0.2, pwn: 0.1, dev: 0.5 },
  { mat: 1.0, pos: 0.5, ks: 0.4, pwn: 0.2, dev: 0.1 },
  { mat: 1.0, pos: 0.4, ks: 0.1, pwn: 0.3, dev: 0.0 },
];

const MAX_CACHE_SIZE = 50000;

export class ChessEvaluator {
  private cache = new Map<string, number>();

  private pruneCache(): void {
    if (this.cache.size > MAX_CACHE_SIZE) {
      const entriesToRemove = this.cache.size - Math.floor(MAX_CACHE_SIZE * 0.7);
      const iterator = this.cache.keys();
      for (let i = 0; i < entriesToRemove; i++) {
        const key = iterator.next().value;
        if (key) this.cache.delete(key);
      }
    }
  }

  evaluate(chess: Chess, color: Color): number {
    const fen = chess.fen();
    if (this.cache.has(fen)) return this.cache.get(fen)!;

    if (chess.isCheckmate()) return chess.turn() === color ? -1000 : 1000;
    if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) return 0;

    const board = chess.board();
    const white = color === "w";
    const backRank = white ? 0 : 7;

    let mat = 0;
    let pos = 0;
    let tot = 0;
    let dev = 0;
    let kRank = -1;
    const pawnFiles = new Array(8).fill(0);
    const pawnRanks: number[][] = Array.from({ length: 8 }, () => []);

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (!piece) continue;

        const val = PIECE_VALUES[piece.type];
        const own = piece.color === color;
        const sign = own ? 1 : -1;

        if (piece.type !== "k") tot += val;
        mat += sign * val;

        const row = piece.color === "w" ? 7 - rank : rank;
        const pst = tot > 15 ? PST : PST_EG;
        pos += sign * pst[piece.type][row][file];

        if (piece.type === "k" && own) kRank = rank;

        if (piece.type === "p" && own) {
          pawnFiles[file]++;
          pawnRanks[file].push(rank);
        }

        if (own) {
          if ((piece.type === "n" || piece.type === "b") && rank === backRank) dev -= 0.2;
          if (file >= 3 && file <= 4 && rank >= 3 && rank <= 4) dev += 0.3;
        }
      }
    }

    const phase = tot > 30 ? 0 : tot > 15 ? 1 : 2;
    const w = WEIGHTS[phase];

    let pwn = 0;
    for (let f = 0; f < 8; f++) {
      if (pawnFiles[f] > 1) pwn -= 0.5 * (pawnFiles[f] - 1);
      if (f < 7 && pawnFiles[f] > 0 && pawnFiles[f + 1] > 0) pwn += 0.1;
    }

    let ks = 0;
    if (kRank >= 0) {
      if (white) {
        if (kRank < 2) ks = 0.5;
        else if (kRank > 3) ks = -0.5;
      } else {
        if (kRank > 5) ks = 0.5;
        else if (kRank < 4) ks = -0.5;
      }
    }

    const score = mat * w.mat + pos * w.pos + ks * w.ks + pwn * w.pwn + dev * w.dev;
    this.cache.set(fen, score);
    this.pruneCache();
    return score;
  }
}
