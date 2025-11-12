import type { Square } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";
import { Index } from "solid-js";

import { useChess } from "~/contexts/ChessContext";

import { ChessCoordinates, files, ranks } from "./ChessCoordinates";
import { ChessSquare, squareColor } from "./ChessSquare";

export const ChessBoard: Component = (): JSX.Element => {
  const { flip } = useChess();
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
          <Index each={squares}>
            {(square: Accessor<Square>, index: number): JSX.Element => {
              return <ChessSquare square={square} color={squareColor(index)} />;
            }}
          </Index>
        </div>

        {/* Right Rank Numbers */}
        <ChessCoordinates type="ranks" flip={flip} gridArea="2 / 10 / 10 / 11" />

        {/* Bottom File Letters */}
        <ChessCoordinates type="files" flip={flip} gridArea="10 / 2 / 11 / 10" />
      </div>
    </div>
  );
};

export const squares: Readonly<Square[]> = Object.freeze(
  ranks.flatMap((rank: number): Square[] => files.map((file: string): Square => `${file}${rank}` as Square)),
);
