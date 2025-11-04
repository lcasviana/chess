import type { Color, PieceSymbol } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";

export type ChessPieceType = {
  id?: string;
  color: Color;
  type: PieceSymbol;
};

export type ChessPieceProps = {
  piece: Accessor<ChessPieceType>;
  selected?: Accessor<boolean>;
  flip?: Accessor<boolean>;
};

export const ChessPiece: Component<ChessPieceProps> = ({ piece, selected, flip }: ChessPieceProps): JSX.Element => {
  const { id, color, type } = piece();
  return (
    <svg
      id={id}
      style={{ "view-transition-name": id }}
      class="size-full drop-shadow-xs transition-all duration-200"
      classList={{
        "fill-zinc-300 drop-shadow-zinc-900": color === "w",
        "fill-zinc-900 drop-shadow-zinc-300": color === "b",
        "scale-125": selected?.(),
        "rotate-180": flip?.(),
      }}
      aria-label={`${colorNames[color]} ${pieceNames[type]}`}
      role="img"
    >
      <use href={`./chess.svg#${type}`} />
    </svg>
  );
};

const colorNames: Readonly<Record<Color, string>> = Object.freeze({
  w: "White",
  b: "Black",
});

const pieceNames: Readonly<Record<PieceSymbol, string>> = Object.freeze({
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
});
