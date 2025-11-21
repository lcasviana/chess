import { Chess, type Move } from "chess.js";
import { createChessBot } from "../services/chess-bot";

export interface WorkerRequest {
  type: "getBestMove";
  fen: string;
  config?: {
    searchDepth?: number;
    useOpeningBook?: boolean;
    openingBookDepth?: number;
    randomizationEnabled?: boolean;
    evaluationNoise?: number;
    similarMoveThreshold?: number;
  };
}

export interface WorkerResponse {
  type: "bestMove";
  move: Move | null;
  error?: string;
}

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const { type, fen, config } = event.data;

  if (type === "getBestMove") {
    try {
      const chess = new Chess(fen);
      const bot = createChessBot(chess, config);
      const move = bot.getBestMove();

      const response: WorkerResponse = {
        type: "bestMove",
        move,
      };

      self.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = {
        type: "bestMove",
        move: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      self.postMessage(response);
    }
  }
});
