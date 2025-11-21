import type { Color } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";
import { Show } from "solid-js";

import { useChess } from "~/contexts/ChessContext";
import { falsy } from "~/utils/constants";

import type { ChessPieceType } from "./ChessPiece";
import { ChessPiece, colorNames } from "./ChessPiece";

type GameResult = "win" | "lose" | "draw" | "stalemate";

export const ChessEnd: Component = (): JSX.Element => {
  const { isGameOver, isCheckmate, isDraw, isStalemate, isThreefoldRepetition, isInsufficientMaterial, turn, player, resetGame } = useChess();

  const getGameResult = (): GameResult => {
    if (isCheckmate()) {
      // If it's checkmate, the current turn is the loser (they can't move)
      return turn() === player() ? "lose" : "win";
    }
    if (isStalemate()) {
      return "stalemate";
    }
    if (isDraw() || isThreefoldRepetition() || isInsufficientMaterial()) {
      return "draw";
    }
    return "draw"; // fallback
  };

  const getResultMessage = (): string => {
    const result = getGameResult();
    switch (result) {
      case "win":
        return `Checkmate! ${colorNames[player()]} Wins!`;
      case "lose":
        return `Checkmate! ${colorNames[turn()]} Wins!`;
      case "stalemate":
        return "Stalemate!";
      case "draw":
        if (isThreefoldRepetition()) return "Draw by Threefold Repetition!";
        if (isInsufficientMaterial()) return "Draw by Insufficient Material!";
        return "Draw!";
    }
  };

  const getResultPiece = (): Accessor<ChessPieceType> => {
    const result = getGameResult();
    if (result === "win") {
      return () => ({ id: "", color: player(), type: "k" });
    }
    if (result === "lose") {
      return () => ({ id: "", color: turn(), type: "k" });
    }
    // For draw/stalemate, show the player's king
    return () => ({ id: "", color: player(), type: "k" });
  };

  return (
    <Show when={isGameOver()}>
      <div class="fixed inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-xs">
        <div class="flex flex-col items-center gap-3 rounded-lg bg-stone-800 p-4 pt-3 shadow-sm shadow-stone-600">
          <h2 class="text-base/normal font-bold text-white">{getResultMessage()}</h2>
          <div class="size-16">
            <ChessPiece piece={getResultPiece()} selected={falsy} flip={falsy} />
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
