import type { Move } from "chess.js";
import type { BotConfig } from "./chess-bot";

export class ChessBotWorkerManager {
  private worker: Worker | null = null;
  private pending = new Map<number, { resolve: (move: Move | null) => void; reject: (error: Error) => void }>();
  private nextId = 0;

  constructor() {
    if (typeof Worker !== "undefined") {
      this.initWorker();
    }
  }

  private initWorker(): void {
    this.worker = new Worker(new URL("../workers/chess-bot.worker", import.meta.url), { type: "module" });
    this.worker.onmessage = (e: MessageEvent<{ id: number; move: Move | null; error?: string }>) => {
      const { id, move, error } = e.data;
      const p = this.pending.get(id);
      if (!p) return;
      error ? p.reject(new Error(error)) : p.resolve(move);
      this.pending.delete(id);
    };
  }

  async getBestMove(fen: string, config?: Partial<BotConfig>): Promise<Move | null> {
    if (!this.worker) throw new Error("Worker not initialized");
    const id = this.nextId++;
    return new Promise<Move | null>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage({ id, fen, config });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pending.forEach((p) => p.reject(new Error("Worker terminated")));
    this.pending.clear();
  }
}

let instance: ChessBotWorkerManager | null = null;

export function getChessBotWorkerManager(): ChessBotWorkerManager {
  if (!instance) instance = new ChessBotWorkerManager();
  return instance;
}

export function terminateChessBotWorker(): void {
  if (instance) {
    instance.terminate();
    instance = null;
  }
}
