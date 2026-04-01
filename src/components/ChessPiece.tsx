import type { Accessor, Component, JSX } from "solid-js";

import type { Color, PieceSymbol } from "chess.js";

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

export const ChessPiece: Component<ChessPieceProps> = (props: ChessPieceProps): JSX.Element => {
  return (
    <svg
      id={props.piece().id}
      style={{ "view-transition-name": props.piece().id }}
      class="size-full drop-shadow-xs transition-all duration-200"
      classList={{
        "fill-zinc-300 drop-shadow-zinc-900": props.piece().color === "w",
        "fill-zinc-900 drop-shadow-zinc-300": props.piece().color === "b",
        "scale-125": props.selected(),
        "rotate-180": props.flip(),
      }}
      aria-label={`${colorNames[props.piece().color]} ${pieceNames[props.piece().type]}`}
      role="img"
    >
      <use href={`./chess.svg#${props.piece().type}`} />
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

export const whiteKing: Accessor<ChessPieceType> = (): ChessPieceType => ({ id: "white-king", color: "w", type: "k" });
export const blackKing: Accessor<ChessPieceType> = (): ChessPieceType => ({ id: "black-king", color: "b", type: "k" });
