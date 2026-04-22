import type { Move } from "~/chess";

type Resolver = (move: Move | null) => void;

class StockfishWorkerManager {
  private worker: Worker;
  private ready: Promise<void>;
  private resolver: Resolver | null = null;

  constructor() {
    this.worker = new Worker("/engine/stockfish-18.js");

    this.ready = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Stockfish init timeout")), 10000);

      const init = (e: MessageEvent<string>) => {
        if (typeof e.data !== "string") return;
        if (e.data === "readyok") {
          clearTimeout(timeout);
          this.worker.removeEventListener("message", init);
          this.worker.addEventListener("message", this.onMessage);
          resolve();
        } else if (e.data === "uciok") {
          this.worker.postMessage("isready");
        }
      };

      this.worker.addEventListener("message", init);
      this.worker.addEventListener("error", (e) => {
        clearTimeout(timeout);
        reject(new Error(e.message));
      });
      this.worker.postMessage("uci");
    });
  }

  private onMessage = (e: MessageEvent<string>) => {
    if (typeof e.data !== "string" || !e.data.startsWith("bestmove")) return;
    const parts = e.data.split(" ");
    const raw = parts[1];
    if (!raw || raw === "(none)") {
      this.resolver?.(null);
    } else {
      this.resolver?.({
        from: raw.slice(0, 2),
        to: raw.slice(2, 4),
        promotion: raw.length === 5 ? raw[4] : undefined,
      } as Move);
    }
    this.resolver = null;
  };

  async getBestMove(fen: string): Promise<Move | null> {
    await this.ready;
    return new Promise<Move | null>((resolve) => {
      this.resolver = resolve;
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage("go movetime 500");
    });
  }

  terminate(): void {
    this.worker.terminate();
  }
}

let instance: StockfishWorkerManager | null = null;

export function getChessBotWorkerManager(): StockfishWorkerManager {
  if (!instance) instance = new StockfishWorkerManager();
  return instance;
}

export function terminateChessBotWorker(): void {
  if (instance) {
    instance.terminate();
    instance = null;
  }
}
