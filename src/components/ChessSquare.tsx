import type { Square } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";
import { Show } from "solid-js";

import type { ChessPieceType } from "./ChessPiece";
import { ChessPiece } from "./ChessPiece";

export type ChessSquareColor = "light" | "dark";
export type ChessSquareInCheck = "check" | "checkmate" | null;

export type ChessSquareProps = {
  square: Accessor<Square>;
  color: Accessor<ChessSquareColor>;
  piece: Accessor<ChessPieceType | null>;
  selected: Accessor<boolean>;
  lastMove: Accessor<boolean>;
  validMove: Accessor<boolean>;
  inCheck: Accessor<ChessSquareInCheck>;
  onClick: () => void;
};

export const ChessSquare: Component<ChessSquareProps> = ({
  square,
  color,
  piece,
  selected,
  lastMove,
  validMove,
  inCheck,
  onClick,
}: ChessSquareProps): JSX.Element => {
  return (
    <div
      id={square()}
      class="relative inline-flex aspect-square items-center justify-center select-none hover:opacity-95"
      classList={{
        "bg-red-900 animate-bounce": inCheck() !== null,
        "bg-amber-200/25": !inCheck() && lastMove(),
        "bg-stone-500": !inCheck() && !lastMove() && color() === "light",
        "bg-stone-600": !inCheck() && !lastMove() && color() === "dark",
        "cursor-pointer": validMove() || !!piece(),
      }}
      aria-label={`Square ${square().toUpperCase()}`}
      onClick={onClick}
    >
      <Show when={piece()}>
        {(piece) => (
          <div class="flex size-full items-center justify-center">
            <ChessPiece piece={piece} selected={selected} />
          </div>
        )}
      </Show>
      <Show when={validMove() && !piece()}>
        <div class="size-1/6 animate-pulse rounded-full bg-stone-50/50" />
      </Show>
      <Show when={validMove() && piece()}>
        <div class="absolute inset-2 rounded-full border-4 border-stone-50/50 opacity-50" />
      </Show>
    </div>
  );
};
