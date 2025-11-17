import type { Square } from "chess.js";
import { SQUARES } from "chess.js";
import type { Component, JSX } from "solid-js";
import { For } from "solid-js";

import { useChess } from "~/contexts/ChessContext";

import { ChessCoordinates } from "./ChessCoordinates";
import { ChessSquare } from "./ChessSquare";

export const ChessBoard: Component = (): JSX.Element => {
  const { flip, getSquareColor } = useChess();
  return (
    <div class="grid aspect-square size-full overflow-auto bg-stone-800 shadow-sm shadow-neutral-950">
      <div
        style="grid-template: auto repeat(8, 1fr) auto / auto repeat(8, 1fr) auto"
        class="grid aspect-square size-full max-h-dvh max-w-dvw overflow-auto"
        classList={{ "rotate-180": flip() }}
      >
        {/* Top File Letters */}
        <ChessCoordinates type="files" flip={flip} gridArea="1 / 2 / 2 / 10" />

        {/* Left Rank Numbers */}
        <ChessCoordinates type="ranks" flip={flip} gridArea="2 / 1 / 10 / 2" />

        {/* Chess board */}
        <div role="grid" aria-label="Chess Board" class="grid grid-cols-8 grid-rows-8" style={{ "grid-area": "2 / 2 / 10 / 10" }}>
          <For each={SQUARES}>{(square: Square): JSX.Element => <ChessSquare square={square} color={getSquareColor(square)} />}</For>
        </div>

        {/* Right Rank Numbers */}
        <ChessCoordinates type="ranks" flip={flip} gridArea="2 / 10 / 10 / 11" />

        {/* Bottom File Letters */}
        <ChessCoordinates type="files" flip={flip} gridArea="10 / 2 / 11 / 10" />
      </div>
    </div>
  );
};
