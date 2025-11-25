import type { Chess, Color, PieceSymbol, Square } from "chess.js";

export type GamePhase = "opening" | "middlegame" | "endgame";

export type PhaseWeights = {
  material: number;
  positional: number;
  kingSafety: number;
  pawnStructure: number;
  development: number;
};

export type AllPhaseWeights = {
  opening: PhaseWeights;
  middlegame: PhaseWeights;
  endgame: PhaseWeights;
};

export type PieceSquareTable = number[][];

export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const scaleTables = (tables: PieceSquareTable[]): PieceSquareTable[] => tables.map((table) => table.map((row) => row.map((val) => val / 100)));

const [PAWN_TABLE, KNIGHT_TABLE, BISHOP_TABLE, ROOK_TABLE, QUEEN_TABLE, KING_MG_TABLE, KING_EG_TABLE] = scaleTables([
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

const PST: Record<PieceSymbol, PieceSquareTable> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_MG_TABLE,
};

const PST_EG: Record<PieceSymbol, PieceSquareTable> = {
  ...PST,
  k: KING_EG_TABLE,
};

const PHASE_WEIGHTS: AllPhaseWeights = {
  opening: {
    material: 1.0,
    positional: 0.3,
    kingSafety: 0.2,
    pawnStructure: 0.1,
    development: 0.5,
  },
  middlegame: {
    material: 1.0,
    positional: 0.5,
    kingSafety: 0.4,
    pawnStructure: 0.2,
    development: 0.1,
  },
  endgame: {
    material: 1.0,
    positional: 0.4,
    kingSafety: 0.1,
    pawnStructure: 0.3,
    development: 0.0,
  },
};

export class ChessEvaluator {
  evaluate(chess: Chess, color: Color): number {
    if (chess.isCheckmate()) return chess.turn() === color ? -1000 : 1000;
    if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) return 0;

    const board = chess.board();
    const isWhite = color === "w";
    const backRank = isWhite ? 0 : 7;

    let material = 0;
    let positional = 0;
    let totalMaterial = 0;
    let development = 0;
    let kingSquare: Square | null = null;
    const pawnFiles: Record<number, number[]> = {};

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (!piece) continue;

        const pieceValue = PIECE_VALUES[piece.type];
        const isOurs = piece.color === color;
        const sign = isOurs ? 1 : -1;

        if (piece.type !== "k") totalMaterial += pieceValue;
        material += sign * pieceValue;

        const row = piece.color === "w" ? 7 - rank : rank;
        const tables = totalMaterial > 15 ? PST : PST_EG;
        positional += sign * tables[piece.type][row][file];

        if (piece.type === "k" && isOurs) {
          kingSquare = (String.fromCharCode(97 + file) + (rank + 1)) as Square;
        }

        if (piece.type === "p" && isOurs) {
          (pawnFiles[file] ||= []).push(rank);
        }

        if (isOurs) {
          if ((piece.type === "n" || piece.type === "b") && rank === backRank) {
            development -= 0.2;
          }
          if (file >= 3 && file <= 4 && rank >= 3 && rank <= 4) {
            development += 0.3;
          }
        }
      }
    }

    const phase: GamePhase = totalMaterial > 30 ? "opening" : totalMaterial > 15 ? "middlegame" : "endgame";
    const w = PHASE_WEIGHTS[phase];

    let pawnStructure = 0;
    const files = Object.keys(pawnFiles)
      .map(Number)
      .sort((a, b) => a - b);
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (pawnFiles[f].length > 1) {
        pawnStructure -= 0.5 * (pawnFiles[f].length - 1);
      }
      if (i < files.length - 1 && files[i + 1] - f === 1) {
        pawnStructure += 0.1;
      }
    }

    let kingSafety = 0;
    if (kingSquare) {
      const kRank = parseInt(kingSquare[1]) - 1;
      if (isWhite) {
        if (kRank < 2) kingSafety = 0.5;
        else if (kRank > 3) kingSafety = -0.5;
      } else {
        if (kRank > 5) kingSafety = 0.5;
        else if (kRank < 4) kingSafety = -0.5;
      }
    }

    return (
      material * w.material + positional * w.positional + kingSafety * w.kingSafety + pawnStructure * w.pawnStructure + development * w.development
    );
  }
}
