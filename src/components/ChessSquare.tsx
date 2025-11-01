import type { Piece, Square } from "chess.js";
import { type Component, Match, Show, Switch } from "solid-js";

import { ChessPiece } from "./ChessPiece";

export type ChessSquareColor = "light" | "dark";
export type ChessSquareInCheck = "check" | "checkmate" | null;

type ChessSquareProps = {
  square: Square;
  color: ChessSquareColor;
  piece: Piece | null;
  selected: boolean;
  lastMove: boolean;
  validMove: boolean;
  inCheck: ChessSquareInCheck;
  onClick: (square: Square) => void;
};

export const ChessSquare: Component<ChessSquareProps> = (props) => {
  const isCapture = () => props.validMove && props.piece;
  return (
    <div
      class="relative inline-flex aspect-square items-center justify-center select-none"
      classList={{
        "bg-stone-500": props.color === "light",
        "bg-stone-600": props.color === "dark",
        "shadow-sm shadow-black z-10": props.selected,
        "bg-red-900 animate-pulse": props.inCheck !== null,
      }}
      onClick={() => props.onClick(props.square)}
    >
      <Switch>
        <Match when={props.piece}>{(piece) => <ChessPiece piece={piece()} />}</Match>
        <Match when={props.validMove}>
          <div class="absolute h-3 w-3 rounded-full bg-neutral-100 opacity-50" />
        </Match>
      </Switch>
      <Show when={isCapture()}>
        <div class="absolute inset-2 rounded-full border-4 border-neutral-100 opacity-50" />
      </Show>
    </div>
  );
};
