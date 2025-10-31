import type { Chess, Square } from "chess.js";
import { type Component, For, Show } from "solid-js";

import { ChessPiece } from "./ChessPiece";

interface ChessBoardProps {
  game: Chess;
  playerColor: "w" | "b";
  onSquareClick: (square: Square) => void;
  selectedSquare: Square | null;
  validMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
}

export const ChessBoard: Component<ChessBoardProps> = (props) => {
  const getSquareCoordinates = (row: number, col: number): Square => {
    if (props.playerColor === "w") {
      return `${String.fromCharCode(97 + col)}${8 - row}` as Square;
    } else {
      return `${String.fromCharCode(104 - col)}${row + 1}` as Square;
    }
  };

  const SquareCell = (cellProps: { row: number; col: number }) => {
    const square = () => getSquareCoordinates(cellProps.row, cellProps.col);
    const piece = () => props.game.get(square());
    const isLight = (cellProps.row + cellProps.col) % 2 === 0;
    const isSelected = () => props.selectedSquare === square();
    const isValidMove = () => props.validMoves.includes(square());
    const isLastMoveSquare = () => props.lastMove && (props.lastMove.from === square() || props.lastMove.to === square());
    const isKingInCheck = () => {
      const p = piece();
      return p?.type === "k" && p.color === props.game.turn() && props.game.isCheck();
    };
    const isCapture = () => isValidMove() && piece();

    const squareClass = () =>
      [
        "aspect-square",
        "flex",
        "items-center",
        "justify-center",
        "text-5xl",
        "cursor-pointer",
        "select-none",
        "transition-all",
        "relative",
        isLight ? "bg-neutral-300" : "bg-neutral-500",
        isSelected() && "ring-4 ring-neutral-100 ring-inset",
        isLastMoveSquare() && "bg-yellow-200",
        isKingInCheck() && "bg-red-900 animate-pulse",
      ]
        .filter(Boolean)
        .join(" ");

    return (
      <div class={squareClass()} onClick={() => props.onSquareClick(square())}>
        <Show when={piece()}>{(p) => <ChessPiece piece={p()} />}</Show>
        <Show when={isValidMove() && !piece()}>
          <div class="absolute h-3 w-3 rounded-full bg-neutral-100 opacity-50" />
        </Show>
        <Show when={isCapture()}>
          <div class="absolute inset-2 rounded-full border-4 border-neutral-100 opacity-50" />
        </Show>
      </div>
    );
  };

  const files = () => (props.playerColor === "w" ? ["a", "b", "c", "d", "e", "f", "g", "h"] : ["h", "g", "f", "e", "d", "c", "b", "a"]);

  const ranks = () => (props.playerColor === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]);

  const boardRows = Array.from({ length: 8 }, (_, i) => i);
  const boardCols = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div class="flex flex-col items-center">
      {/* Top file letters */}
      <div class="mb-1 flex">
        <div class="w-6" />
        <For each={files()}>
          {(file) => (
            <div class="flex items-center justify-center text-sm font-semibold text-white/70" style={{ width: "calc(min(70vmin, 600px) / 8)" }}>
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
              <div class="flex items-center justify-center text-sm font-semibold text-white/70" style={{ height: "calc(min(70vmin, 600px) / 8)" }}>
                {rank}
              </div>
            )}
          </For>
        </div>

        {/* Chess board */}
        <div class="relative grid w-[min(70vmin,600px)] grid-cols-8 gap-0 bg-red-500 shadow-2xl">
          <For each={boardRows}>{(row) => <For each={boardCols}>{(col) => <SquareCell row={row} col={col} />}</For>}</For>
        </div>

        {/* Right rank numbers */}
        <div class="flex flex-col justify-around pl-1">
          <For each={ranks()}>
            {(rank) => (
              <div class="flex items-center justify-center text-sm font-semibold text-white/70" style={{ height: "calc(min(70vmin, 600px) / 8)" }}>
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
            <div class="flex items-center justify-center text-sm font-semibold text-white/70" style={{ width: "calc(min(70vmin, 600px) / 8)" }}>
              {file}
            </div>
          )}
        </For>
        <div class="w-6" />
      </div>
    </div>
  );
};
