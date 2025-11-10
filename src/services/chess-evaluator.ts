import type { Chess, Color, PieceSymbol, Square } from "chess.js";

export type GamePhase = "opening" | "middlegame" | "endgame";

export interface EvaluationBreakdown {
  material: number;
  positional: number;
  mobility: number;
  kingSafety: number;
  pawnStructure: number;
  development: number;
  total: number;
}

export interface PhaseWeights {
  material: number;
  positional: number;
  mobility: number;
  kingSafety: number;
  pawnStructure: number;
  development: number;
}

export interface AllPhaseWeights {
  opening: PhaseWeights;
  middlegame: PhaseWeights;
  endgame: PhaseWeights;
}

export type PieceSquareTable = number[][];

export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

/**
 * Piece-Square Tables for positional evaluation
 * Higher values indicate better squares for pieces
 * Tables are from white's perspective (reversed for black)
 */

const PAWN_TABLE: PieceSquareTable = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_TABLE: PieceSquareTable = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_TABLE: PieceSquareTable = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_TABLE: PieceSquareTable = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_TABLE: PieceSquareTable = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_MIDDLEGAME_TABLE: PieceSquareTable = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

const KING_ENDGAME_TABLE: PieceSquareTable = [
  [-50, -40, -30, -20, -20, -30, -40, -50],
  [-30, -20, -10, 0, 0, -10, -20, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -30, 0, 0, 0, 0, -30, -30],
  [-50, -30, -30, -30, -30, -30, -30, -50],
];

/**
 * Evaluation weights for different game phases
 */
const PHASE_WEIGHTS: AllPhaseWeights = {
  opening: {
    material: 1.0,
    positional: 0.3,
    mobility: 0.15,
    kingSafety: 0.2,
    pawnStructure: 0.1,
    development: 0.5, // High in opening
  },
  middlegame: {
    material: 1.0,
    positional: 0.5,
    mobility: 0.3,
    kingSafety: 0.4,
    pawnStructure: 0.2,
    development: 0.1,
  },
  endgame: {
    material: 1.0,
    positional: 0.4,
    mobility: 0.25,
    kingSafety: 0.1,
    pawnStructure: 0.3,
    development: 0.0, // Irrelevant in endgame
  },
};

/**
 * Chess Position Evaluator
 */
export class ChessEvaluator {
  /**
   * Detect current game phase based on material
   */
  private detectGamePhase(chess: Chess): GamePhase {
    const board = chess.board();
    let totalMaterial = 0;

    for (const row of board) {
      for (const square of row) {
        if (square && square.type !== "k") {
          totalMaterial += PIECE_VALUES[square.type];
        }
      }
    }

    // Opening: both sides have most pieces (>30 material)
    // Middlegame: some trades happened (15-30 material)
    // Endgame: few pieces left (<15 material)
    if (totalMaterial > 30) return "opening";
    if (totalMaterial > 15) return "middlegame";
    return "endgame";
  }

  /**
   * Get piece-square table value for a piece
   */
  private getPieceSquareValue(piece: PieceSymbol, square: Square, color: Color, phase: GamePhase): number {
    // Convert square to coordinates
    const file = square.charCodeAt(0) - 97; // a=0, b=1, ...
    const rank = parseInt(square[1]) - 1; // 1=0, 2=1, ...

    // For black pieces, flip the board
    const row = color === "w" ? 7 - rank : rank;
    const col = file;

    let table: PieceSquareTable;
    switch (piece) {
      case "p":
        table = PAWN_TABLE;
        break;
      case "n":
        table = KNIGHT_TABLE;
        break;
      case "b":
        table = BISHOP_TABLE;
        break;
      case "r":
        table = ROOK_TABLE;
        break;
      case "q":
        table = QUEEN_TABLE;
        break;
      case "k":
        table = phase === "endgame" ? KING_ENDGAME_TABLE : KING_MIDDLEGAME_TABLE;
        break;
      default:
        return 0;
    }

    return table[row][col] / 100; // Scale down to centipawns
  }

  /**
   * Evaluate material balance
   */
  private evaluateMaterial(chess: Chess, color: Color): number {
    const board = chess.board();
    let material = 0;

    for (const row of board) {
      for (const square of row) {
        if (square) {
          const value = PIECE_VALUES[square.type];
          material += square.color === color ? value : -value;
        }
      }
    }

    return material;
  }

  /**
   * Evaluate positional value using piece-square tables
   */
  private evaluatePositional(chess: Chess, color: Color, phase: GamePhase): number {
    const board = chess.board();
    let positional = 0;

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        if (square) {
          const squareName = String.fromCharCode(97 + file) + (rank + 1);
          const value = this.getPieceSquareValue(square.type, squareName as Square, square.color, phase);
          positional += square.color === color ? value : -value;
        }
      }
    }

    return positional;
  }

  /**
   * Evaluate mobility (number of legal moves)
   */
  private evaluateMobility(chess: Chess, color: Color): number {
    // Count moves for current side
    const currentTurn = chess.turn();
    let ourMoves = 0;
    let theirMoves = 0;

    if (currentTurn === color) {
      ourMoves = chess.moves().length;

      // Make a null move to count opponent's moves
      const fen = chess.fen();
      const parts = fen.split(" ");
      parts[1] = color === "w" ? "b" : "w"; // Switch turn
      try {
        const tempChess = new (chess as any).constructor(parts.join(" "));
        theirMoves = tempChess.moves().length;
      } catch {
        theirMoves = 0;
      }
    } else {
      theirMoves = chess.moves().length;
      ourMoves = 20; // Estimate
    }

    return (ourMoves - theirMoves) * 0.1; // Scale down
  }

  /**
   * Evaluate king safety
   */
  private evaluateKingSafety(chess: Chess, color: Color): number {
    let safety = 0;

    // Find king position
    const board = chess.board();
    let kingSquare: Square | null = null;

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        if (square && square.type === "k" && square.color === color) {
          kingSquare = (String.fromCharCode(97 + file) + (rank + 1)) as Square;
          break;
        }
      }
      if (kingSquare) break;
    }

    if (!kingSquare) return 0;

    // Check for pawn shield (simplified)
    const file = kingSquare.charCodeAt(0) - 97;
    const rank = parseInt(kingSquare[1]) - 1;

    if (color === "w" && rank < 2) {
      // White king on back ranks is safer in middlegame
      safety += 0.5;
    } else if (color === "b" && rank > 5) {
      // Black king on back ranks is safer in middlegame
      safety += 0.5;
    }

    // Penalty for exposed king
    if (color === "w" && rank > 3) {
      safety -= 0.5;
    } else if (color === "b" && rank < 4) {
      safety -= 0.5;
    }

    return safety;
  }

  /**
   * Evaluate pawn structure (simplified)
   */
  private evaluatePawnStructure(chess: Chess, color: Color): number {
    const board = chess.board();
    let structure = 0;
    const pawnFiles: Record<number, number> = {};

    // Count pawns per file
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        if (square && square.type === "p" && square.color === color) {
          pawnFiles[file] = (pawnFiles[file] || 0) + 1;
        }
      }
    }

    // Penalty for doubled pawns
    for (const file in pawnFiles) {
      if (pawnFiles[file] > 1) {
        structure -= 0.5 * (pawnFiles[file] - 1);
      }
    }

    // Bonus for connected pawns (simplified - check adjacent files)
    const files = Object.keys(pawnFiles)
      .map(Number)
      .sort((a, b) => a - b);
    for (let i = 0; i < files.length - 1; i++) {
      if (files[i + 1] - files[i] === 1) {
        structure += 0.1;
      }
    }

    return structure;
  }

  /**
   * Evaluate piece development in opening
   */
  private evaluateDevelopment(chess: Chess, color: Color): number {
    const board = chess.board();
    let development = 0;

    // Check if knights and bishops are developed
    const backRank = color === "w" ? 0 : 7;

    for (let file = 0; file < 8; file++) {
      const square = board[backRank][file];
      if (square && square.color === color) {
        if (square.type === "n" || square.type === "b") {
          // Penalty for undeveloped pieces
          development -= 0.2;
        }
      }
    }

    // Bonus for controlling center
    const centerSquares: Square[] = ["d4", "d5", "e4", "e5"];
    for (const square of centerSquares) {
      const file = square.charCodeAt(0) - 97;
      const rank = parseInt(square[1]) - 1;
      const piece = board[rank][file];
      if (piece && piece.color === color) {
        development += 0.3;
      }
    }

    return development;
  }

  /**
   * Main evaluation function
   * Returns score from the perspective of the given color
   * Positive = good for color, Negative = bad for color
   */
  evaluate(chess: Chess, color: Color): number {
    // Check for game over
    if (chess.isCheckmate()) {
      return chess.turn() === color ? -1000 : 1000;
    }
    if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
      return 0;
    }

    const phase = this.detectGamePhase(chess);
    const weights = PHASE_WEIGHTS[phase];

    const material = this.evaluateMaterial(chess, color) * weights.material;
    const positional = this.evaluatePositional(chess, color, phase) * weights.positional;
    const mobility = this.evaluateMobility(chess, color) * weights.mobility;
    const kingSafety = this.evaluateKingSafety(chess, color) * weights.kingSafety;
    const pawnStructure = this.evaluatePawnStructure(chess, color) * weights.pawnStructure;
    const development = this.evaluateDevelopment(chess, color) * weights.development;

    return material + positional + mobility + kingSafety + pawnStructure + development;
  }

  /**
   * Detailed evaluation breakdown for debugging
   */
  evaluateDetailed(chess: Chess, color: Color): EvaluationBreakdown {
    const phase = this.detectGamePhase(chess);
    const weights = PHASE_WEIGHTS[phase];

    const material = this.evaluateMaterial(chess, color);
    const positional = this.evaluatePositional(chess, color, phase);
    const mobility = this.evaluateMobility(chess, color);
    const kingSafety = this.evaluateKingSafety(chess, color);
    const pawnStructure = this.evaluatePawnStructure(chess, color);
    const development = this.evaluateDevelopment(chess, color);

    return {
      material: material * weights.material,
      positional: positional * weights.positional,
      mobility: mobility * weights.mobility,
      kingSafety: kingSafety * weights.kingSafety,
      pawnStructure: pawnStructure * weights.pawnStructure,
      development: development * weights.development,
      total:
        material * weights.material +
        positional * weights.positional +
        mobility * weights.mobility +
        kingSafety * weights.kingSafety +
        pawnStructure * weights.pawnStructure +
        development * weights.development,
    };
  }
}
