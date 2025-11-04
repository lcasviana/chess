import type { Chess } from "chess.js";

/**
 * Chess Bot using Minimax algorithm with Alpha-Beta Pruning
 *
 * Coordinate System:
 * - Position tables use a flat array of 64 elements (0-63)
 * - Index 0 = a1, Index 7 = h1, Index 56 = a8, Index 63 = h8
 * - For White: index = rank * 8 + file (where rank 0 = 1st rank, file 0 = a-file)
 * - For Black: tables are mirrored using (7 - rank) * 8 + (7 - file)
 *
 * Evaluation:
 * - Positive scores indicate White advantage
 * - Negative scores indicate Black advantage
 * - Material values are in centipawns (100 = 1 pawn)
 */

// Piece values for evaluation (in centipawns)
const PIECE_VALUES: Record<string, number> = {
  p: 100, // Pawn
  n: 320, // Knight
  b: 330, // Bishop
  r: 500, // Rook
  q: 900, // Queen
  k: 20000, // King
};

// Position bonuses for pieces (encouraging center control)
const PAWN_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5,
  -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_TABLE = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15,
  20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
];

const BISHOP_TABLE = [
  -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10,
  10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
];

const ROOK_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0,
  0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
];

const QUEEN_TABLE = [
  -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5,
  -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
];

const KING_MIDDLEGAME_TABLE = [
  -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50,
  -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30,
  20,
];

const KING_ENDGAME_TABLE = [
  -50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50,
];

const POSITION_TABLES: Record<string, number[]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_MIDDLEGAME_TABLE, // Will switch to endgame in evaluateBoard
};

/**
 * Determines if the game is in the endgame phase based on material.
 * Endgame is when both sides have no queens or when every side which has a queen has no other pieces or one minor piece maximum.
 */
function isEndgame(game: Chess): boolean {
  const board = game.board();
  let whiteQueens = 0;
  let blackQueens = 0;
  let whiteMaterial = 0;
  let blackMaterial = 0;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.type !== "k" && piece.type !== "p") {
        if (piece.type === "q") {
          if (piece.color === "w") whiteQueens++;
          else blackQueens++;
        }
        const value = PIECE_VALUES[piece.type] ?? 0;
        if (piece.color === "w") whiteMaterial += value;
        else blackMaterial += value;
      }
    }
  }

  // No queens on either side
  if (whiteQueens === 0 && blackQueens === 0) return true;

  // If a side has a queen, it must have minimal other material (<=minor piece)
  if (whiteQueens > 0 && whiteMaterial > 1200) return false;
  if (blackQueens > 0 && blackMaterial > 1200) return false;

  return true;
}

/**
 * Evaluate the board position from White's perspective.
 * Positive scores favor White, negative scores favor Black.
 * Uses piece-square tables that automatically switch between middlegame and endgame for the king.
 */
function evaluateBoard(game: Chess): number {
  let score = 0;
  const board = game.board();
  const isEndgamePhase = isEndgame(game);

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const pieceValue = PIECE_VALUES[piece.type] ?? 0;
        const positionIndex = piece.color === "w" ? i * 8 + j : (7 - i) * 8 + (7 - j);

        // Use endgame king table in endgame, otherwise use regular position tables
        let positionBonus = 0;
        if (piece.type === "k" && isEndgamePhase) {
          positionBonus = KING_ENDGAME_TABLE[positionIndex] || 0;
        } else {
          positionBonus = POSITION_TABLES[piece.type]?.[positionIndex] || 0;
        }

        const totalValue = pieceValue + positionBonus;
        score += piece.color === "w" ? totalValue : -totalValue;
      }
    }
  }

  return score;
}

/**
 * Minimax algorithm with Alpha-Beta Pruning.
 * @param game - The current chess game state
 * @param depth - Remaining search depth
 * @param alpha - Alpha value for pruning (best value for maximizer)
 * @param beta - Beta value for pruning (best value for minimizer)
 * @param maximizingPlayer - True if maximizing (White), false if minimizing (Black)
 * @returns Evaluation score from White's perspective
 */
function minimax(game: Chess, depth: number, alpha: number, beta: number, maximizingPlayer: boolean): number {
  if (game.isGameOver()) {
    if (game.isCheckmate()) {
      // Return a score that favors faster checkmates
      // If maximizing player is in checkmate, return large negative score
      // If minimizing player is in checkmate, return large positive score
      return maximizingPlayer ? -Infinity + depth : Infinity - depth;
    }
    // Draw (stalemate, insufficient material, etc.)
    return 0;
  }

  if (depth === 0) {
    return evaluateBoard(game);
  }

  const moves = game.moves({ verbose: true });

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Find the best move for the current player using minimax with alpha-beta pruning.
 * @param game - The current chess game state
 * @param depth - Search depth (number of half-moves to look ahead). Default is 3.
 *                Higher values provide stronger play but take longer to compute.
 * @returns The best move in SAN (Standard Algebraic Notation) format, or null if no legal moves
 */
export function findBestMove(game: Chess, depth: number = 3): string | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  const isWhiteTurn = game.turn() === "w";

  // White maximizes (seeks highest value), Black minimizes (seeks lowest value)
  let bestValue = isWhiteTurn ? -Infinity : Infinity;

  for (const move of moves) {
    game.move(move);
    const boardValue = minimax(game, depth - 1, -Infinity, Infinity, !isWhiteTurn);
    game.undo();

    // Update best move based on whose turn it is
    if (isWhiteTurn) {
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    } else {
      if (boardValue < bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    }
  }

  return bestMove.san;
}
