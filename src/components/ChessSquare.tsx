import type { Chess, Piece, Square } from "chess.js";
import { type Component, Match, Show, Switch } from "solid-js";

import { ChessPiece } from "./ChessPiece";

type ChessSquareProps = {
  row: number;
  col: number;
  playerColor: "w" | "b";
  game: Chess;
  onSquareClick: (square: Square) => void;
  selectedSquare: Square | null;
  validMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
};

export const ChessCell: Component<ChessSquareProps> = (props) => {
  const getSquareCoordinates = (row: number, col: number): Square => {
    if (props.playerColor === "w") {
      return `${String.fromCharCode(97 + col)}${8 - row}` as Square;
    } else {
      return `${String.fromCharCode(104 - col)}${row + 1}` as Square;
    }
  };

  const square = () => getSquareCoordinates(props.row, props.col);
  const piece = (): Piece | null => props.game.get(square()) ?? null;
  const isLight = (props.row + props.col) % 2 === 0;
  const isSelected = () => props.selectedSquare === square();
  const isValidMove = () => props.validMoves.includes(square());
  const isKingInCheck = () => {
    const p = piece();
    return p?.type === "k" && p.color === props.game.turn() && props.game.isCheck();
  };
  const isCapture = () => isValidMove() && piece();

  return (
    <div
      class="relative inline-flex aspect-square items-center justify-center select-none"
      classList={{
        "bg-stone-500": isLight,
        "bg-stone-600": !isLight,
        "inset-shadow-sm inset-shadow-black": isSelected(),
        "bg-red-900 animate-pulse": isKingInCheck(),
      }}
      onClick={() => props.onSquareClick(square())}
    >
      <Switch>
        <Match when={piece()}>{(piece) => <ChessPiece piece={piece()} />}</Match>
        <Match when={isValidMove()}>
          <div class="absolute h-3 w-3 rounded-full bg-neutral-100 opacity-50" />
        </Match>
      </Switch>
      <Show when={isCapture()}>
        <div class="absolute inset-2 rounded-full border-4 border-neutral-100 opacity-50" />
      </Show>
    </div>
  );
};
