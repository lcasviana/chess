import type { Chess, Square } from "chess.js";
import { createMemo, For, Index, type Component } from "solid-js";

import { ChessSquare } from "./ChessSquare";

interface ChessBoardProps {
  game: Chess;
  flip: boolean;
  onSquareClick: (square: Square) => void;
  selectedSquare: Square | null;
  validMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
}

const Label = (props: { children: any }) => (
  <div class="flex items-center justify-center text-sm font-semibold text-stone-50/50">{props.children}</div>
);

export const ChessBoard: Component<ChessBoardProps> = (props) => {
  const files = () => (!props.flip ? ["A", "B", "C", "D", "E", "F", "G", "H"] : ["H", "G", "F", "E", "D", "C", "B", "A"]);
  const ranks = () => (!props.flip ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]);

  const board = createMemo(() => {
    const board = Array.from({ length: 64 }, (_, i) => {
      const row = Math.floor(i / 8);
      const col = i % 8;
      return `${String.fromCharCode(97 + col)}${8 - row}` as Square;
    });

    if (props.flip) {
      board.reverse();
    }
    return board;
  });

  return (
    <div
      class="grid bg-stone-800 shadow-sm shadow-neutral-950"
      style="grid-template-columns: 24px repeat(8, calc(min(70vmin, 600px) / 8)) 24px; grid-template-rows: 24px repeat(8, calc(min(70vmin, 600px) / 8)) 24px; width: calc(min(70vmin, 600px) + 48px); height: calc(min(70vmin, 600px) + 48px);"
    >
      {/* Top file letters */}
      <div class="col-start-2 col-end-10 row-start-1 row-end-2 grid grid-cols-8">
        <For each={files()}>{(file) => <Label>{file}</Label>}</For>
      </div>

      {/* Left rank numbers */}
      <div class="col-start-1 col-end-2 row-start-2 row-end-10 grid grid-rows-8">
        <For each={ranks()}>{(rank) => <Label>{rank}</Label>}</For>
      </div>

      {/* Chess board */}
      <div class="relative col-start-2 col-end-10 row-start-2 row-end-10 grid grid-cols-8 gap-0 shadow-sm shadow-neutral-950">
        <Index each={board()}>
          {(square) => {
            const sq = square();
            const fileIndex = sq.charCodeAt(0) - 97;
            const rankIndex = parseInt(sq.substring(1), 10) - 1;
            const color = (fileIndex + rankIndex) % 2 !== 0 ? "light" : "dark";

            return (
              <ChessSquare
                square={sq}
                piece={props.game.get(sq) ?? null}
                color={color}
                onClick={props.onSquareClick}
                selected={props.selectedSquare === sq}
                validMove={props.validMoves?.includes(sq)}
                lastMove={!!props?.lastMove?.to}
                inCheck={null}
              />
            );
          }}
        </Index>
      </div>

      {/* Right rank numbers */}
      <div class="col-start-10 col-end-11 row-start-2 row-end-10 grid grid-rows-8">
        <For each={ranks()}>{(rank) => <Label>{rank}</Label>}</For>
      </div>

      {/* Bottom file letters */}
      <div class="col-start-2 col-end-10 row-start-10 row-end-11 grid grid-cols-8">
        <For each={files()}>{(file) => <Label>{file}</Label>}</For>
      </div>
    </div>
  );
};
