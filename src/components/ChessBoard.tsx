import type { Chess, Square } from "chess.js";
import { For, Index, type Component } from "solid-js";

import type { PieceRegistry } from "~/lib/piece-registry";
import { getPieceIdAtSquare } from "~/lib/piece-registry";

import { ChessSquare } from "./ChessSquare";

interface ChessBoardProps {
  game: Chess;
  pieceRegistry: PieceRegistry;
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
  return (
    <div
      class="grid bg-stone-800 shadow-sm shadow-neutral-950"
      style="grid-template-columns: 24px repeat(8, calc(min(70vmin, 600px) / 8)) 24px; grid-template-rows: 24px repeat(8, calc(min(70vmin, 600px) / 8)) 24px; width: calc(min(70vmin, 600px) + 48px); height: calc(min(70vmin, 600px) + 48px);"
    >
      {/* Top file letters */}
      <div class="col-start-2 col-end-10 row-start-1 row-end-2 grid grid-cols-8">
        <For each={files}>{(file) => <Label>{file}</Label>}</For>
      </div>

      {/* Left rank numbers */}
      <div class="col-start-1 col-end-2 row-start-2 row-end-10 grid grid-rows-8">
        <For each={ranks}>{(rank) => <Label>{rank}</Label>}</For>
      </div>

      {/* Chess board */}
      <div class="relative col-start-2 col-end-10 row-start-2 row-end-10 grid grid-cols-8 gap-0 shadow-sm shadow-neutral-950">
        <Index each={squares}>
          {(square, index) => {
            const fileIndex = index % 8;
            const rankIndex = Math.floor(index / 8);
            const color = (fileIndex + rankIndex) % 2 === 0 ? "dark" : "light";
            const pieceId = () => getPieceIdAtSquare(props.pieceRegistry, square());
            const piece = () => {
              const piece = props.game.get(square());
              return piece ? { ...piece, id: pieceId()! } : null;
            };
            return (
              <ChessSquare
                square={square}
                piece={piece}
                color={() => color}
                onClick={() => props.onSquareClick(square())}
                selected={() => props.selectedSquare === square()}
                validMove={() => props.validMoves?.includes(square())}
                lastMove={() => props?.lastMove?.from === square() || props?.lastMove?.to === square()}
                inCheck={() => null}
              />
            );
          }}
        </Index>
      </div>

      {/* Right rank numbers */}
      <div class="col-start-10 col-end-11 row-start-2 row-end-10 grid grid-rows-8">
        <For each={ranks}>{(rank) => <Label>{rank}</Label>}</For>
      </div>

      {/* Bottom file letters */}
      <div class="col-start-2 col-end-10 row-start-10 row-end-11 grid grid-cols-8">
        <For each={files}>{(file) => <Label>{file}</Label>}</For>
      </div>
    </div>
  );
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [1, 2, 3, 4, 5, 6, 7, 8].reverse();
const squares = ranks.flatMap((rank) => files.map((file) => `${file}${rank}` as Square));
