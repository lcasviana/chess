import type { Square } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";
import { For } from "solid-js";

import { useChess } from "~/contexts/ChessContext";

import { ChessCoordinates, files, ranks } from "./ChessCoordinates";
import type { ChessPieceType } from "./ChessPiece";
import type { ChessSquareInCheck, ChessSquareProps } from "./ChessSquare";
import { ChessSquare, squareColor } from "./ChessSquare";

export const ChessBoard: Component = (): JSX.Element => {
  const { player, flip, getSquarePiece, getSquareSelected, getSquareLastMove, getSquareValidMove, getSquareInCheck, onSquareClick } = useChess();
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
          <For each={squares}>
            {(square: Square, index: Accessor<number>): JSX.Element => {
              const piece: ChessSquareProps["piece"] = (): ChessPieceType | null => getSquarePiece(square);
              const selected: ChessSquareProps["selected"] = (): boolean => getSquareSelected(square);
              const lastMove: ChessSquareProps["lastMove"] = (): boolean => getSquareLastMove(square);
              const validMove: ChessSquareProps["validMove"] = (): boolean => getSquareValidMove(square);
              const inCheck: ChessSquareProps["inCheck"] = (): ChessSquareInCheck | null => getSquareInCheck(square);
              const onClick: ChessSquareProps["onClick"] = (): void => onSquareClick(square);
              return (
                <ChessSquare
                  square={square}
                  color={squareColor(index())}
                  player={player}
                  flip={flip}
                  piece={piece}
                  selected={selected}
                  lastMove={lastMove}
                  validMove={validMove}
                  inCheck={inCheck}
                  onClick={onClick}
                />
              );
            }}
          </For>
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
