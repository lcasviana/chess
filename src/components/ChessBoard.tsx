import type { Chess, Square } from "chess.js";
import { type Component, For } from "solid-js";

import { ChessCell } from "./ChessSquare";

interface ChessBoardProps {
  game: Chess;
  playerColor: "w" | "b";
  onSquareClick: (square: Square) => void;
  selectedSquare: Square | null;
  validMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
}

export const ChessBoard: Component<ChessBoardProps> = (props) => {
  const files = () => (props.playerColor === "w" ? ["A", "B", "C", "D", "E", "F", "G", "H"] : ["H", "G", "F", "E", "D", "C", "B", "A"]);

  const ranks = () => (props.playerColor === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]);

  const boardRows = Array.from({ length: 8 }, (_, i) => i);
  const boardCols = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div class="flex flex-col items-center bg-stone-800 shadow-sm shadow-neutral-950">
      {/* Top file letters */}
      <div class="mb-1 flex">
        <div class="w-6" />
        <For each={files()}>
          {(file) => (
            <div class="flex items-center justify-center text-sm font-semibold text-stone-50/50" style={{ width: "calc(min(70vmin, 600px) / 8)" }}>
              {file}
            </div>
          )}
        </For>
        <div class="w-6" />
      </div>

      {/* Board with rank numbers */}
      <div class="flex">
        {/* Left rank numbers */}
        <div class="flex flex-col justify-around pr-1">
          <For each={ranks()}>
            {(rank) => (
              <div class="flex items-center justify-center text-sm font-semibold text-stone-50/50" style={{ height: "calc(min(70vmin, 600px) / 8)" }}>
                {rank}
              </div>
            )}
          </For>
        </div>

        {/* Chess board */}
        <div class="relative grid w-[min(70vmin,600px)] grid-cols-8 gap-0 shadow-sm shadow-neutral-950">
          <For each={boardRows}>
            {(row) => (
              <For each={boardCols}>
                {(col) => (
                  <ChessCell
                    row={row}
                    col={col}
                    playerColor={props.playerColor}
                    game={props.game}
                    onSquareClick={props.onSquareClick}
                    selectedSquare={props.selectedSquare}
                    validMoves={props.validMoves}
                    lastMove={props.lastMove}
                  />
                )}
              </For>
            )}
          </For>
        </div>

        {/* Right rank numbers */}
        <div class="flex flex-col justify-around pl-1">
          <For each={ranks()}>
            {(rank) => (
              <div class="flex items-center justify-center text-sm font-semibold text-stone-50/50" style={{ height: "calc(min(70vmin, 600px) / 8)" }}>
                {rank}
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Bottom file letters */}
      <div class="mt-1 flex">
        <div class="w-6" />
        <For each={files()}>
          {(file) => (
            <div class="flex items-center justify-center text-sm font-semibold text-stone-50/50" style={{ width: "calc(min(70vmin, 600px) / 8)" }}>
              {file}
            </div>
          )}
        </For>
        <div class="w-6" />
      </div>
    </div>
  );
};
