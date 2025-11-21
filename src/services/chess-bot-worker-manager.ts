import type { Move } from "chess.js";
import type { BotConfig } from "./chess-bot";
import type { WorkerRequest, WorkerResponse } from "../workers/chess-bot.worker";

export class ChessBotWorkerManager {
  private worker: Worker | null = null;
  private pendingRequest: {
    resolve: (move: Move | null) => void;
    reject: (error: Error) => void;
  } | null = null;

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker(): void {
    try {
      // Vite/Vinxi will handle the ?worker suffix to properly bundle the worker
      this.worker = new Worker(new URL("../workers/chess-bot.worker.ts", import.meta.url), {
        type: "module",
      });

      this.worker.addEventListener("message", this.handleWorkerMessage.bind(this));
      this.worker.addEventListener("error", this.handleWorkerError.bind(this));
    } catch (error) {
      console.error("[ChessBotWorker] Failed to initialize worker:", error);
    }
  }

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { type, move, error } = event.data;

    if (type === "bestMove" && this.pendingRequest) {
      if (error) {
        this.pendingRequest.reject(new Error(error));
      } else {
        this.pendingRequest.resolve(move);
      }
      this.pendingRequest = null;
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error("[ChessBotWorker] Worker error:", error);
    if (this.pendingRequest) {
      this.pendingRequest.reject(new Error("Worker encountered an error"));
      this.pendingRequest = null;
    }
  }

  async getBestMove(fen: string, config?: Partial<BotConfig>): Promise<Move | null> {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    if (this.pendingRequest) {
      throw new Error("Another request is already in progress");
    }

    return new Promise<Move | null>((resolve, reject) => {
      this.pendingRequest = { resolve, reject };

      const request: WorkerRequest = {
        type: "getBestMove",
        fen,
        config,
      };

      this.worker!.postMessage(request);
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.pendingRequest) {
      this.pendingRequest.reject(new Error("Worker terminated"));
      this.pendingRequest = null;
    }
  }
}

let workerManagerInstance: ChessBotWorkerManager | null = null;

export function getChessBotWorkerManager(): ChessBotWorkerManager {
  if (!workerManagerInstance) {
    workerManagerInstance = new ChessBotWorkerManager();
  }
  return workerManagerInstance;
}

export function terminateChessBotWorker(): void {
  if (workerManagerInstance) {
    workerManagerInstance.terminate();
    workerManagerInstance = null;
  }
}
