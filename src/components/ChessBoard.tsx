import type { Color, Piece, Square } from "chess.js";
import { Index, type Accessor, type Component } from "solid-js";

import type { PieceRegistry } from "~/lib/piece-registry";
import { getPieceIdAtSquare } from "~/lib/piece-registry";

import { ChessCoordinates, files, ranks } from "./ChessCoordinates";
import { ChessSquare } from "./ChessSquare";

export type ChessBoardProps = {
  boardState: Accessor<(square: Square) => Piece | null>;
  player: Accessor<Color>;
  pieceRegistry: Accessor<PieceRegistry>;
  selectedSquare: Accessor<Square | null>;
  validMoves: Accessor<Square[]>;
  lastMove: Accessor<{ from: Square; to: Square } | null>;
  onSquareClick: (square: Square) => void;
};

export const ChessBoard: Component<ChessBoardProps> = (props) => {
  const flip = () => props.player() === "b";
  return (
    <div
      class="grid bg-stone-800 shadow-sm shadow-neutral-950"
      style="grid-template-columns: 24px repeat(8, calc(min(70vmin, 600px) / 8)) 24px; grid-template-rows: 24px repeat(8, calc(min(70vmin, 600px) / 8)) 24px; width: calc(min(70vmin, 600px) + 48px); height: calc(min(70vmin, 600px) + 48px);"
      classList={{ "rotate-180": flip() }}
    >
      {/* Top File Letters */}
      <ChessCoordinates type="files" flip={flip} colStart={2} colEnd={10} rowStart={1} rowEnd={2} />

      {/* Left Rank Numbers */}
      <ChessCoordinates type="ranks" flip={flip} colStart={1} colEnd={2} rowStart={2} rowEnd={10} />

      {/* Chess board */}
      <div class="col-start-2 col-end-10 row-start-2 row-end-10 grid grid-cols-8 gap-0 shadow-sm shadow-neutral-950">
        <Index each={squares}>
          {(square, index) => {
            const fileIndex = index % 8;
            const rankIndex = Math.floor(index / 8);
            const color = (fileIndex + rankIndex) % 2 === 0 ? "dark" : "light";
            const piece = () => {
              const sq = square();
              const piece = props.boardState()(sq);
              const id = getPieceIdAtSquare(props.pieceRegistry(), sq);
              return id && piece ? { ...piece, id } : null;
            };
            return (
              <ChessSquare
                square={square}
                color={() => color}
                player={props.player}
                piece={piece}
                onClick={() => props.onSquareClick(square())}
                selected={() => props.selectedSquare() === square()}
                flip={flip}
                validMove={() => props.validMoves()?.includes(square())}
                lastMove={() => props.lastMove()?.from === square() || props.lastMove()?.to === square()}
                inCheck={() => null}
              />
            );
          }}
        </Index>
      </div>

      {/* Right Rank Numbers */}
      <ChessCoordinates type="ranks" flip={flip} colStart={10} colEnd={11} rowStart={2} rowEnd={10} />

      {/* Bottom File Letters */}
      <ChessCoordinates type="files" flip={flip} colStart={2} colEnd={10} rowStart={10} rowEnd={11} />
    </div>
  );
};

export const squares = ranks.flatMap((rank) => files.map((file) => `${file}${rank}` as Square));
