import type { Accessor, Component, JSX } from "solid-js";
import { Show, createEffect } from "solid-js";

import type { Square } from "~/chess";
import { useChess } from "~/contexts/ChessContext";
import { getAdjacentSquare } from "~/utils/keyboard-navigation";

import type { ChessPieceType } from "./ChessPiece";
import { ChessPiece, colorNames, pieceNames } from "./ChessPiece";

export type ChessSquareColor = "light" | "dark" | null;
export type ChessSquareInCheck = "check" | "checkmate" | null;

export type ChessSquareProps = {
  square: Square;
  color: ChessSquareColor;
};

export const ChessSquare: Component<ChessSquareProps> = (props: ChessSquareProps): JSX.Element => {
  const { player, flip, board, selectedSquare, focusedSquare, setFocusedSquare, validMoves, lastMove, onSquareClick, isCheck, isCheckmate, turn } =
    useChess();

  let squareRef: HTMLDivElement | undefined;

  const piece = () => board()[props.square];
  const isSelected = () => selectedSquare() === props.square;
  const isFocused = () => focusedSquare() === props.square;
  const isValidMove = () => validMoves().includes(props.square);
  const isLastMove = () => lastMove()?.from === props.square || lastMove()?.to === props.square;
  const tabIndex = () => (isFocused() ? 0 : -1);
  const isInCheck = (): ChessSquareInCheck => {
    if (piece()?.type !== "k" || piece()?.color !== turn()) return null;
    if (isCheckmate()) return "checkmate";
    if (isCheck()) return "check";
    return null;
  };
  const rowIndex = () => 9 - parseInt(props.square[1]);
  const colIndex = () => props.square.charCodeAt(0) - 96;

  createEffect(() => {
    if (isFocused() && squareRef) {
      squareRef.focus();
    }
  });

  const onSquarePress = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSquareClick(props.square);
      return;
    }

    const arrowMap: Record<string, "up" | "down" | "left" | "right" | undefined> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };

    const direction = arrowMap[event.key];
    if (!direction) return;

    event.preventDefault();
    const nextSquare = getAdjacentSquare(props.square, direction, flip());
    if (nextSquare) {
      setFocusedSquare(nextSquare);
    }
  };

  const getEnhancedAriaLabel = (
    square: Square,
    piece: ChessPieceType | null | undefined,
    isSelected: boolean,
    isValidMove: boolean,
    inCheck: ChessSquareInCheck,
  ): string => {
    const parts = [square.toUpperCase()];

    if (piece) {
      const pieceName = pieceNames[piece.type] || piece.type;
      parts.push(`${colorNames[piece.color]} ${pieceName}`);
    } else {
      parts.push(isValidMove ? "valid move" : "empty");
    }

    if (isSelected) parts.push("selected");
    if (isValidMove && piece) parts.push("capturable");
    if (inCheck === "check") parts.push("in check");
    else if (inCheck === "checkmate") parts.push("in checkmate");

    return parts.join(", ");
  };

  return (
    <div
      ref={(el) => (squareRef = el)}
      id={props.square}
      tabIndex={tabIndex()}
      role="gridcell"
      aria-selected={isSelected()}
      aria-rowindex={rowIndex()}
      aria-colindex={colIndex()}
      style={{ padding: "15%" }}
      class="relative inline-flex aspect-square items-center justify-center select-none hover:opacity-85 focus:outline-none focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-800"
      classList={{
        "bg-red-200/25": isInCheck() !== null,
        "animate-pulse": isInCheck() === "check",
        "bg-amber-200/25": !isInCheck() && isLastMove(),
        "bg-stone-500": !isInCheck() && !isLastMove() && props.color === "light",
        "bg-stone-600": !isInCheck() && !isLastMove() && props.color === "dark",
        "cursor-pointer": isValidMove() || piece()?.color === player(),
      }}
      aria-label={getEnhancedAriaLabel(props.square, piece(), isSelected(), isValidMove(), isInCheck())}
      onKeyDown={(event: KeyboardEvent) => onSquarePress(event)}
      onClick={() => onSquareClick(props.square)}
    >
      <Show when={piece()}>
        {(piece: Accessor<ChessPieceType>): JSX.Element => (
          <div aria-hidden="true" class="flex size-full items-center justify-center">
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
