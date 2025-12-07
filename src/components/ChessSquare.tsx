import type { Square } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";
import { Show } from "solid-js";

import { useChess } from "~/contexts/ChessContext";

import type { ChessPieceType } from "./ChessPiece";
import { ChessPiece } from "./ChessPiece";

export type ChessSquareColor = "light" | "dark" | null;
export type ChessSquareInCheck = "check" | "checkmate" | null;

export type ChessSquareProps = {
  square: Square;
  color: ChessSquareColor;
};

export const ChessSquare: Component<ChessSquareProps> = ({ square, color }: ChessSquareProps): JSX.Element => {
  const { player, flip, board, selectedSquare, validMoves, lastMove, onSquareClick, isCheck, isCheckmate, turn } = useChess();

  const piece = () => board()[square];
  const isSelected = () => selectedSquare() === square;
  const isValidMove = () => validMoves().includes(square);
  const isLastMove = () => lastMove()?.from === square || lastMove()?.to === square;
  const isInCheck = (): ChessSquareInCheck => {
    if (piece()?.type !== "k" || piece()?.color !== turn()) return null;
    if (isCheckmate()) return "checkmate";
    if (isCheck()) return "check";
    return null;
  };

  return (
    <div
      id={square}
      style={{ padding: "15%" }}
      class="relative inline-flex aspect-square items-center justify-center select-none hover:opacity-85"
      classList={{
        "bg-red-200/25": isInCheck() !== null,
        "animate-pulse": isInCheck() === "check",
        "bg-amber-200/25": !isInCheck() && isLastMove(),
        "bg-stone-500": !isInCheck() && !isLastMove() && color === "light",
        "bg-stone-600": !isInCheck() && !isLastMove() && color === "dark",
        "cursor-pointer": isValidMove() || piece()?.color === player(),
      }}
      aria-label={`Square ${square.toUpperCase()}`}
      onKeyPress={(event: KeyboardEvent) => onSquarePress(event, square)}
      onClick={() => onSquareClick(square)}
    >
      <Show when={piece()}>
        {(piece: Accessor<ChessPieceType>): JSX.Element => (
          <div class="flex size-full items-center justify-center">
            <ChessPiece piece={piece} selected={isSelected} flip={flip} />
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

function onSquarePress(event: KeyboardEvent, square: Square) {}
