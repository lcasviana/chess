import { Chess } from "chess.js";

// Piece values for evaluation
const PIECE_VALUES: { [key: string]: number } = {
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

const KING_TABLE = [
  -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50,
  -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30,
  20,
];

const POSITION_TABLES: { [key: string]: number[] } = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  k: KING_TABLE,
};

// Evaluate the board position
function evaluateBoard(game: Chess): number {
  let score = 0;
  const board = game.board();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const pieceValue = PIECE_VALUES[piece.type];
        const positionIndex = piece.color === "w" ? i * 8 + j : (7 - i) * 8 + j;
        const positionBonus = POSITION_TABLES[piece.type]?.[positionIndex] || 0;

        const totalValue = pieceValue + positionBonus;
        score += piece.color === "w" ? totalValue : -totalValue;
      }
    }
  }

  return score;
}

// Minimax with Alpha-Beta Pruning
function minimax(game: Chess, depth: number, alpha: number, beta: number, maximizingPlayer: boolean): number {
  if (depth === 0 || game.isGameOver()) {
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

// Find the best move for Black (AI)
export function findBestMove(game: Chess, depth: number = 3): string | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestValue = Infinity;

  for (const move of moves) {
    game.move(move);
    const boardValue = minimax(game, depth - 1, -Infinity, Infinity, true);
    game.undo();

    if (boardValue < bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }

  return bestMove.san;
}
