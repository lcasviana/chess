import type { Square } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";
import { Show } from "solid-js";

import { useChess } from "~/contexts/ChessContext";

import type { ChessPieceType } from "./ChessPiece";
import { ChessPiece } from "./ChessPiece";

export type ChessSquareColor = "light" | "dark";
export type ChessSquareInCheck = "check" | "checkmate" | null;

export type ChessSquareProps = {
  square: Accessor<Square>;
  color: ChessSquareColor;
};

export const ChessSquare: Component<ChessSquareProps> = ({ square, color }: ChessSquareProps): JSX.Element => {
  const { player, flip, board, selectedSquare, validMoves, lastMove, onSquareClick } = useChess();

  const piece = () => board()[square()];
  const isSelected = () => selectedSquare() === square();
  const isValidMove = () => validMoves().includes(square());
  const isLastMove = () => lastMove()?.from === square() || lastMove()?.to === square();
  const isInCheck = () => null;

  return (
    <div
      id={square()}
      style={{ padding: "15%" }}
      class="relative inline-flex aspect-square items-center justify-center select-none hover:opacity-85"
      classList={{
        "bg-red-200/25 animate-pulse": isInCheck() !== null,
        "bg-amber-200/25": !isInCheck() && isLastMove(),
        "bg-stone-500": !isInCheck() && !isLastMove() && color === "light",
        "bg-stone-600": !isInCheck() && !isLastMove() && color === "dark",
        "cursor-pointer": isValidMove() || piece()?.color === player(),
      }}
      aria-label={`Square ${square().toUpperCase()}`}
      onClick={() => onSquareClick(square())}
    >
      <Show when={piece()}>
        {(piece: Accessor<ChessPieceType>): JSX.Element => (
          <div class="flex size-full items-center justify-center">
            <ChessPiece id={() => piece().id} color={() => piece().color} type={() => piece().type} selected={isSelected} flip={flip} />
          </div>
        )}
      </Show>
      <Show when={isValidMove() && !piece()}>
        <div class="size-1/5 animate-pulse rounded-full bg-stone-50/50" />
      </Show>
      <Show when={isValidMove() && piece()}>
        <div style={{ inset: "5%" }} class="absolute rounded-full border-4 border-stone-50/50 opacity-50" />
      </Show>
    </div>
  );
};

export function squareColor(index: number): ChessSquareColor {
  const fileIndex: number = index % 8;
  const rankIndex: number = Math.floor(index / 8);
  const color: ChessSquareColor = (fileIndex + rankIndex) % 2 === 0 ? "dark" : "light";
  return color;
}
