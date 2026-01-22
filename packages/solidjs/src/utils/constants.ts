import type { Accessor } from "solid-js";
import type { PieceSymbol, Square } from "chess.js";

export const truthy: Accessor<true> = (): true => true;
export const falsy: Accessor<false> = (): false => false;

export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const CENTER_SQUARES = new Set<Square>(["e4", "d4", "e5", "d5"]);
