import type { Color, Piece } from "chess.js";
import type { Component } from "solid-js";

type ChessPieceProps = {
  piece: Piece;
};

export const ChessPiece: Component<ChessPieceProps> = ({ piece }) => {
  const { color, type } = piece;
  return (
    <svg class={`size-3/4 drop-shadow-xs ${classes[color]}`}>
      <use href={`./chess.svg#${type}`} />
    </svg>
  );
};

const classes: Record<Color, string> = {
  w: "fill-zinc-300 drop-shadow-zinc-900",
  b: "fill-zinc-900 drop-shadow-zinc-300",
};
