import type { Accessor, Component, JSX } from "solid-js";
import { Show, createEffect, createMemo } from "solid-js";

import type { Color } from "~/chess";
import { useChess } from "~/contexts/ChessContext";
import { falsy } from "~/utils/constants";

import type { ChessPieceType } from "./ChessPiece";
import { ChessPiece, blackKing, colorNames, whiteKing } from "./ChessPiece";

type GameResult = {
  message: string;
  player: Color | null;
};

export const ChessEnd: Component = (): JSX.Element => {
  const { isGameOver, isCheckmate, isStalemate, isThreefoldRepetition, isInsufficientMaterial, turn, player, resetGame } = useChess();

  const result = createMemo<GameResult>(() => {
    if (isCheckmate()) {
      const isPlayerWin = turn() !== player();
      const winner = isPlayerWin ? player() : turn();
      return { message: `Checkmate! ${colorNames[winner]} Wins!`, player: winner };
    }
    if (isStalemate()) return { message: "Stalemate!", player: null };
    if (isThreefoldRepetition()) return { message: "Draw by Threefold Repetition!", player: null };
    if (isInsufficientMaterial()) return { message: "Draw by Insufficient Material!", player: null };
    return { message: "Draw!", player: null };
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

  let playAgainRef: HTMLButtonElement | undefined;

  createEffect(() => {
    if (isGameOver() && playAgainRef) playAgainRef.focus();
  });

  return (
    <Show when={isGameOver()}>
      <div class="fixed inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-xs">
        <div
          class="flex flex-col items-center gap-3 rounded-lg bg-stone-800 p-4 pt-3 shadow-sm shadow-stone-600"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chess-end-title"
        >
          <h2 id="chess-end-title" class="text-base/normal font-bold text-white">
            {result().message}
          </h2>
          <div class="size-16">
            <ChessPiece piece={resultPlayer()} selected={falsy} flip={falsy} />
          </div>
          <button
            ref={(el) => (playAgainRef = el)}
            class="mt-1 cursor-pointer rounded-lg px-3 py-1 text-base font-bold transition-all"
            classList={{
              "bg-zinc-300 text-zinc-900 hover:bg-zinc-400": player() === "w",
              "bg-zinc-900 text-zinc-300 hover:bg-zinc-800": player() === "b",
            }}
            onClick={resetGame}
          >
            Play Again
          </button>
        </div>
      </div>
    </Show>
  );
};
