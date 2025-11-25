import { Chess, type Color, type Move } from "chess.js";
import { ChessEvaluator } from "./chess-evaluator";
import * as OpeningBook from "./opening-book";

export interface BotConfig {
  searchDepth: number;
  useOpeningBook: boolean;
  openingBookDepth: number;
  randomizationEnabled: boolean;
  evaluationNoise: number;
}

const DEFAULT_CONFIG: BotConfig = {
  searchDepth: 3,
  useOpeningBook: true,
  openingBookDepth: 10,
  randomizationEnabled: true,
  evaluationNoise: 0.1,
};

const CENTER = new Set(["d4", "d5", "e4", "e5", "c4", "c5", "f4", "f5"]);
const PIECE_VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };

export class ChessBot {
  private evaluator: ChessEvaluator;
  private config: BotConfig;
  private tt = new Map<string, { score: number; depth: number; move: Move | null }>();

  constructor(
    private chess: Chess,
    config: Partial<BotConfig> = {},
  ) {
    this.evaluator = new ChessEvaluator();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getBestMove(): Move | null {
    if (this.config.useOpeningBook && OpeningBook.shouldUseBook(this.chess, this.config.openingBookDepth)) {
      const bookMove = OpeningBook.getBookMove(this.chess);
      if (bookMove) {
        const moves = this.chess.moves({ verbose: true });
        const temp = new Chess(this.chess.fen());
        const move = moves.find((m) => {
          temp.load(this.chess.fen());
          const result = temp.move(m);
          return result?.san === bookMove;
        });
        if (move) return move;
      }
    }

    const color = this.chess.turn();
    const result = this.minimax(this.chess, this.config.searchDepth, -Infinity, Infinity, true, color);
    return result.move;
  }

  private minimax(chess: Chess, depth: number, alpha: number, beta: number, max: boolean, col: Color): { move: Move | null; score: number } {
    const key = chess.fen() + depth;
    const cached = this.tt.get(key);
    if (cached && cached.depth >= depth) return { move: cached.move, score: cached.score };

    if (depth === 0 || chess.isGameOver()) {
      const score = this.evaluator.evaluate(chess, col);
      const noise = this.config.randomizationEnabled ? (Math.random() - 0.5) * this.config.evaluationNoise * 2 : 0;
      return { move: null, score: score + noise };
    }

    const moves = chess.moves({ verbose: true });
    this.orderMoves(moves);

    let bestMove: Move | null = null;

    if (max) {
      let maxEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, false, col);
        chess.undo();

        if (evaluation.score > maxEval) {
          maxEval = evaluation.score;
          bestMove = move;
        }

        alpha = Math.max(alpha, evaluation.score);
        if (beta <= alpha) break;
      }

      this.tt.set(key, { score: maxEval, depth, move: bestMove });
      if (this.tt.size > 50000) this.tt.clear();
      return { move: bestMove, score: maxEval };
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, true, col);
        chess.undo();

        if (evaluation.score < minEval) {
          minEval = evaluation.score;
          bestMove = move;
        }

        beta = Math.min(beta, evaluation.score);
        if (beta <= alpha) break;
      }

      this.tt.set(key, { score: minEval, depth, move: bestMove });
      if (this.tt.size > 50000) this.tt.clear();
      return { move: bestMove, score: minEval };
    }
  }

  private orderMoves(moves: Move[]): void {
    moves.sort((a, b) => {
      const sa = (a.captured ? PIECE_VAL[a.captured] * 10 - PIECE_VAL[a.piece] : 0) + (CENTER.has(a.to) ? 2 : 0);
      const sb = (b.captured ? PIECE_VAL[b.captured] * 10 - PIECE_VAL[b.piece] : 0) + (CENTER.has(b.to) ? 2 : 0);
      return sb - sa;
    });
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
