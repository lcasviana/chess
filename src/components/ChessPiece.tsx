import type { Color, PieceSymbol } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";

export type ChessPieceType = {
  id?: string;
  color: Color;
  type: PieceSymbol;
};

export type ChessPieceProps = {
  id?: Accessor<string | undefined>;
  color: Accessor<Color>;
  type: Accessor<PieceSymbol>;
  selected?: Accessor<boolean>;
  flip?: Accessor<boolean>;
};

export const ChessPiece: Component<ChessPieceProps> = ({ id, color, type, selected, flip }: ChessPieceProps): JSX.Element => {
  return (
    <svg
      id={id?.()}
      style={{ "view-transition-name": id?.() }}
      class="size-full drop-shadow-xs transition-all duration-200"
      classList={{
        "fill-zinc-300 drop-shadow-zinc-900": color() === "w",
        "fill-zinc-900 drop-shadow-zinc-300": color() === "b",
        "scale-125": selected?.(),
        "rotate-180": flip?.(),
      }}
      aria-label={`${colorNames[color()]} ${pieceNames[type()]}`}
      role="img"
    >
      <use href={`./chess.svg#${type()}`} />
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
