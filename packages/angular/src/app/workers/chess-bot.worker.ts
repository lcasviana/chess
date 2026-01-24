/// <reference lib="webworker" />

import { Chess } from "chess.js";
import { createChessBot, type BotConfig } from "../services/chess-bot";

addEventListener("message", (e: MessageEvent<{ id: number; fen: string; config?: Partial<BotConfig> }>) => {
  const { id, fen, config } = e.data;
  const chess = new Chess(fen);
  const bot = createChessBot(chess, config);
  const move = bot.getBestMove();
  postMessage({ id, move });
});
