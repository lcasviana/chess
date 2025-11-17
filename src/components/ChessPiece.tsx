import type { Color, PieceSymbol } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";

export type ChessPieceType = {
  id: string;
  color: Color;
  type: PieceSymbol;
};

export type ChessPieceProps = {
  piece: Accessor<ChessPieceType>;
  selected: Accessor<boolean>;
  flip: Accessor<boolean>;
};

export const ChessPiece: Component<ChessPieceProps> = ({ piece, selected, flip }: ChessPieceProps): JSX.Element => {
  return (
    <svg
      id={piece().id}
      style={{ "view-transition-name": piece().id }}
      class="size-full drop-shadow-xs transition-all duration-200"
      classList={{
        "fill-zinc-300 drop-shadow-zinc-900": piece().color === "w",
        "fill-zinc-900 drop-shadow-zinc-300": piece().color === "b",
        "scale-125": selected(),
        "rotate-180": flip(),
      }}
      aria-label={`${colorNames[piece().color]} ${pieceNames[piece().type]}`}
      role="img"
    >
      <use href={`./chess.svg#${piece().type}`} />
    </svg>
  );
};

export const colors: Readonly<Color[]> = Object.freeze(["w", "b"]);

export const colorNames: Readonly<Record<Color, string>> = Object.freeze({
  w: "White",
  b: "Black",
});

export const pieceNames: Readonly<Record<PieceSymbol, string>> = Object.freeze({
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
});
