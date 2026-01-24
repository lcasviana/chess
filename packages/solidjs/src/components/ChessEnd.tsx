import type { Color } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";
import { createMemo, Show } from "solid-js";

import type { ChessPieceType } from "@chess/shared";
import { useChess } from "~/contexts/ChessContext";
import { falsy } from "~/utils/constants";
import { blackKing, ChessPiece, colorNames, whiteKing } from "./ChessPiece";

type GameResultWithWinner = {
  type: "win" | "lose" | "draw" | "stalemate";
  player: Color | null;
};

export const ChessEnd: Component = (): JSX.Element => {
  const { isGameOver, isCheckmate, isDraw, isStalemate, isThreefoldRepetition, isInsufficientMaterial, turn, player, resetGame } = useChess();

  const result = createMemo<GameResultWithWinner>(() => {
    if (isCheckmate()) {
      const isPlayerWin = turn() !== player();
      return {
        type: isPlayerWin ? "win" : "lose",
        player: isPlayerWin ? player() : turn(),
      };
    }
    if (isStalemate()) {
      return { type: "stalemate", player: null };
    }
    if (isDraw() || isThreefoldRepetition() || isInsufficientMaterial()) {
      return { type: "draw", player: null };
    }
    return { type: "draw", player: null };
  });

  const resultMessage = createMemo(() => {
    switch (result().type) {
      case "win":
      case "lose":
        return `Checkmate! ${colorNames[result().player!]} Wins!`;
      case "stalemate":
        return "Stalemate!";
      case "draw":
        if (isThreefoldRepetition()) return "Draw by Threefold Repetition!";
        if (isInsufficientMaterial()) return "Draw by Insufficient Material!";
        return "Draw!";
    }
  });

  const resultPlayer = createMemo<Accessor<ChessPieceType>>(() => {
    switch (result().player) {
      case "w":
        return whiteKing;
      case "b":
        return blackKing;
      default:
        return player() === "w" ? whiteKing : blackKing;
    }
  });

  return (
    <Show when={isGameOver()}>
      <div class="fixed inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-xs">
        <div class="flex flex-col items-center gap-3 rounded-lg bg-stone-800 p-4 pt-3 shadow-sm shadow-stone-600">
          <h2 class="text-base/normal font-bold text-white">{resultMessage()}</h2>
          <div class="size-16">
            <ChessPiece piece={resultPlayer()} selected={falsy} flip={falsy} />
          </div>
          <button
            class="mt-1 cursor-pointer rounded-lg px-3 py-1 text-base font-bold transition-all"
            classList={{
              "bg-zinc-300 text-zinc-900 hover:bg-zinc-400": player() === "w",
              "bg-zinc-900 text-zinc-300 hover:bg-zinc-800": player() === "b",
            }}
            aria-label="Play Again"
            onClick={resetGame}
          >
            Play Again
          </button>
        </div>
      </div>
    </Show>
  );
};
