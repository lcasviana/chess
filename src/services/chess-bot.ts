import { Chess, type Color, type Move } from "chess.js";
import { ChessEvaluator } from "./chess-evaluator";
import * as OpeningBook from "./opening-book";

export interface BotConfig {
  searchDepth: number;
  useOpeningBook: boolean;
  openingBookDepth: number;
  randomizationEnabled: boolean;
  evaluationNoise: number;
  similarMoveThreshold: number;
}

export interface EvaluatedMove {
  move: Move;
  score: number;
}

/**
 * Default bot configuration
 */
const DEFAULT_CONFIG: BotConfig = {
  searchDepth: 3,
  useOpeningBook: true,
  openingBookDepth: 10,
  randomizationEnabled: true,
  evaluationNoise: 0.1,
  similarMoveThreshold: 0.3,
};

export class ChessBot {
  private evaluator: ChessEvaluator;
  private config: BotConfig;
  private nodeCount: number = 0;

  constructor(
    private chess: Chess,
    config: Partial<BotConfig> = {},
  ) {
    this.evaluator = new ChessEvaluator();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the best move for the current position
   */
  getBestMove(): Move | null {
    this.nodeCount = 0;

    if (this.config.useOpeningBook && OpeningBook.shouldUseBook(this.chess, this.config.openingBookDepth)) {
      const bookMove = OpeningBook.getBookMove(this.chess);
      if (bookMove) {
        const moves = this.chess.moves({ verbose: true });
        const move = moves.find((m) => this.moveToSAN(m) === bookMove);
        if (move) {
          return move;
        }
      }
    }

    const color = this.chess.turn();
    const result = this.minimax(this.chess, this.config.searchDepth, -Infinity, Infinity, true, color);
    return result.move;
  }

  private moveToSAN(move: Move): string {
    const tempChess = new Chess(this.chess.fen());
    const result = tempChess.move(move);
    return result ? result.san : "";
  }

  private minimax(chess: Chess, depth: number, alpha: number, beta: number, maximizingPlayer: boolean, botColor: Color): EvaluatedMove {
    this.nodeCount++;

    if (depth === 0 || chess.isGameOver()) {
      const score = this.evaluator.evaluate(chess, botColor);
      const noise = this.config.randomizationEnabled ? (Math.random() - 0.5) * this.config.evaluationNoise * 2 : 0;
      return { move: null as any, score: score + noise };
    }

    const moves = chess.moves({ verbose: true });
    this.orderMoves(moves, chess);

    let bestMove: Move | null = null;

    if (maximizingPlayer) {
      let maxEval = -Infinity;

      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, false, botColor);
        chess.undo();

        if (evaluation.score > maxEval) {
          maxEval = evaluation.score;
          bestMove = move;
        }

        alpha = Math.max(alpha, evaluation.score);
        if (beta <= alpha) {
          break;
        }
      }

      if (this.config.randomizationEnabled && depth === this.config.searchDepth) {
        const similarMoves = this.findSimilarMoves(moves, maxEval, chess, botColor);
        if (similarMoves.length > 1) {
          bestMove = similarMoves[Math.floor(Math.random() * similarMoves.length)];
        }
      }

      return { move: bestMove!, score: maxEval };
    } else {
      let minEval = Infinity;

      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, true, botColor);
        chess.undo();

        if (evaluation.score < minEval) {
          minEval = evaluation.score;
          bestMove = move;
        }

        beta = Math.min(beta, evaluation.score);
        if (beta <= alpha) {
          break;
        }
      }

      return { move: bestMove!, score: minEval };
    }
  }

  private findSimilarMoves(moves: Move[], bestScore: number, chess: Chess, botColor: Color): Move[] {
    const similarMoves: Move[] = [];

    for (const move of moves) {
      chess.move(move);
      const score = this.evaluator.evaluate(chess, botColor);
      chess.undo();

      if (Math.abs(score - bestScore) <= this.config.similarMoveThreshold) {
        similarMoves.push(move);
      }
    }

    return similarMoves.length > 0 ? similarMoves : [moves[0]];
  }

  private orderMoves(moves: Move[], chess: Chess): void {
    moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (a.captured) scoreA += 10;
      if (b.captured) scoreB += 10;

      chess.move(a);
      if (chess.isCheck()) scoreA += 5;
      chess.undo();

      chess.move(b);
      if (chess.isCheck()) scoreB += 5;
      chess.undo();

      if (this.isCenterSquare(a.to)) scoreA += 2;
      if (this.isCenterSquare(b.to)) scoreB += 2;

      return scoreB - scoreA;
    });
  }

  private isCenterSquare(square: string): boolean {
    return ["d4", "d5", "e4", "e5", "c4", "c5", "f4", "f5"].includes(square);
  }

  getPositionEvaluation(color: Color) {
    return this.evaluator.evaluateDetailed(this.chess, color);
  }

  updateConfig(config: Partial<BotConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): BotConfig {
    return { ...this.config };
  }
}

export function createChessBot(chess: Chess, config?: Partial<BotConfig>): ChessBot {
  return new ChessBot(chess, config);
}
