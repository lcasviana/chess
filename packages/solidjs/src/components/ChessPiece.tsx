import type { Color } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";

import { COLOR_NAMES, PIECE_NAMES, type ChessPieceType } from "@chess/shared";

export type { ChessPieceType };
export { COLOR_NAMES as colorNames } from "@chess/shared";

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
      aria-label={`${COLOR_NAMES[piece().color]} ${PIECE_NAMES[piece().type]}`}
      role="img"
    >
      <use href={`./chess.svg#${piece().type}`} />
    </svg>
  );
};

export const colors: Readonly<Color[]> = Object.freeze(["w", "b"]);

export const whiteKing: Accessor<ChessPieceType> = (): ChessPieceType => ({ id: "white-king", color: "w", type: "k" });
export const blackKing: Accessor<ChessPieceType> = (): ChessPieceType => ({ id: "black-king", color: "b", type: "k" });
