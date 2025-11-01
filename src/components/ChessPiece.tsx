import type { Color, Piece } from "chess.js";
import type { Component } from "solid-js";

type ChessPieceProps = {
  piece: Piece;
  size?: number;
};

export const ChessPiece: Component<ChessPieceProps> = ({ piece, size = 48 }) => {
  const { color, type } = piece;
  return (
    <svg class={`drop-shadow-xs ${classes[color]}`} height={size} width={size}>
      <use href={`./chess.svg#${type}`} />
    </svg>
  );
};

const classes: Record<Color, string> = {
  w: "fill-zinc-300 drop-shadow-zinc-900",
  b: "fill-zinc-900 drop-shadow-zinc-300",
};
