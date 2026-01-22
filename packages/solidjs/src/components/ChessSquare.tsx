import type { Square } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";
import { createEffect, Show } from "solid-js";

import { useChess } from "~/contexts/ChessContext";
import { getAdjacentSquare } from "~/utils/keyboard-navigation";

import type { ChessPieceType } from "./ChessPiece";
import { ChessPiece } from "./ChessPiece";

export type ChessSquareColor = "light" | "dark" | null;
export type ChessSquareInCheck = "check" | "checkmate" | null;

export type ChessSquareProps = {
  square: Square;
  color: ChessSquareColor;
};

export const ChessSquare: Component<ChessSquareProps> = ({ square, color }: ChessSquareProps): JSX.Element => {
  const { player, flip, board, selectedSquare, focusedSquare, setFocusedSquare, validMoves, lastMove, onSquareClick, isCheck, isCheckmate, turn } =
    useChess();

  let squareRef: HTMLDivElement | undefined;

  const piece = () => board()[square];
  const isSelected = () => selectedSquare() === square;
  const isFocused = () => focusedSquare() === square;
  const isValidMove = () => validMoves().includes(square);
  const isLastMove = () => lastMove()?.from === square || lastMove()?.to === square;
  const tabIndex = () => (isFocused() ? 0 : -1);
  const isInCheck = (): ChessSquareInCheck => {
    if (piece()?.type !== "k" || piece()?.color !== turn()) return null;
    if (isCheckmate()) return "checkmate";
    if (isCheck()) return "check";
    return null;
  };

  // Auto-focus when focused square changes
  createEffect(() => {
    if (isFocused() && squareRef) {
      squareRef.focus();
    }
  });

  const onSquarePress = (event: KeyboardEvent) => {
    // Enter/Space: Select piece or make move
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSquareClick(square);
      return;
    }

    // Arrow keys: Navigate between squares
    const arrowMap: Record<string, "up" | "down" | "left" | "right" | undefined> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };

    const direction = arrowMap[event.key];
    if (!direction) return;

    event.preventDefault();
    const nextSquare = getAdjacentSquare(square, direction, flip());
    if (nextSquare) {
      setFocusedSquare(nextSquare);
    }
  };

  const getEnhancedAriaLabel = (square: Square, piece: ChessPieceType | null | undefined, isSelected: boolean, isValidMove: boolean): string => {
    const parts = [square.toUpperCase()];

    if (piece) {
      const colorName = piece.color === "w" ? "White" : "Black";
      const pieceNames: Record<string, string> = {
        p: "Pawn",
        n: "Knight",
        b: "Bishop",
        r: "Rook",
        q: "Queen",
        k: "King",
      };
      const pieceName = pieceNames[piece.type] || piece.type;
      parts.push(`${colorName} ${pieceName}`);
    } else {
      parts.push(isValidMove ? "valid move" : "empty");
    }

    if (isSelected) parts.push("selected");
    if (isValidMove && piece) parts.push("capturable");

    return parts.join(", ");
  };

  return (
    <div
      ref={squareRef}
      id={square}
      tabIndex={tabIndex()}
      role="gridcell"
      aria-selected={isSelected()}
      style={{ padding: "15%" }}
      class="relative inline-flex aspect-square items-center justify-center select-none hover:opacity-85 focus:outline-none focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-800"
      classList={{
        "bg-red-200/25": isInCheck() !== null,
        "animate-pulse": isInCheck() === "check",
        "bg-amber-200/25": !isInCheck() && isLastMove(),
        "bg-stone-500": !isInCheck() && !isLastMove() && color === "light",
        "bg-stone-600": !isInCheck() && !isLastMove() && color === "dark",
        "cursor-pointer": isValidMove() || piece()?.color === player(),
      }}
      aria-label={getEnhancedAriaLabel(square, piece(), isSelected(), isValidMove())}
      onKeyDown={(event: KeyboardEvent) => onSquarePress(event)}
      onClick={() => onSquareClick(square)}
    >
      <Show when={piece()}>
        {(piece: Accessor<ChessPieceType>): JSX.Element => (
          <div class="flex size-full items-center justify-center">
            <ChessPiece piece={piece} selected={isSelected as Accessor<boolean>} flip={flip} />
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
