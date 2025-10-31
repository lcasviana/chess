import type { Color, Piece } from "chess.js";
import type { Component } from "solid-js";

type ChessPieceProps = {
  piece: Piece;
  size?: number;
};

const classes: Record<Color, string> = {
  w: "fill-white drop-shadow-black",
  b: "fill-black drop-shadow-white",
};

export const ChessPiece: Component<ChessPieceProps> = ({ piece, size = 48 }) => {
  const { color, type } = piece;
  return (
    <svg class={`drop-shadow-xs ${classes[color]}`} height={size} width={size}>
      <use href={`./chess.svg#${type}`} />
    </svg>
  );
};
