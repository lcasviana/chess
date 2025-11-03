import type { Color, Square } from "chess.js";
import { Index, type Accessor, type Component } from "solid-js";

import { ChessCoordinates, files, ranks } from "./ChessCoordinates";
import type { ChessPieceType } from "./ChessPiece";
import type { ChessSquareInCheck } from "./ChessSquare";
import { ChessSquare, squareColor } from "./ChessSquare";

export type ChessBoardProps = {
  player: Accessor<Color>;
  flip: Accessor<boolean>;
  getSquarePiece: (square: Square) => ChessPieceType | null;
  getSquareSelected: (square: Square) => boolean;
  getSquareLastMove: (square: Square) => boolean;
  getSquareValidMove: (square: Square) => boolean;
  getSquareInCheck: (square: Square) => ChessSquareInCheck | null;
  onSquareClick: (square: Square) => void;
};

export const ChessBoard: Component<ChessBoardProps> = ({
  player,
  flip,
  getSquarePiece,
  getSquareSelected,
  getSquareLastMove,
  getSquareValidMove,
  getSquareInCheck,
  onSquareClick,
}) => {
  return (
    <div class="grid size-full overflow-auto bg-stone-800 shadow-sm shadow-neutral-950">
      <div
        class="grid aspect-square size-full max-h-dvh max-w-dvw overflow-auto"
        style="grid-template: auto repeat(8, 1fr) auto / auto repeat(8, 1fr) auto"
        classList={{ "rotate-180": flip() }}
      >
        {/* Top File Letters */}
        <ChessCoordinates type="files" flip={flip} gridArea="1 / 2 / 2 / 10" />

        {/* Left Rank Numbers */}
        <ChessCoordinates type="ranks" flip={flip} gridArea="2 / 1 / 10 / 2" />

        {/* Chess board */}
        <div class="grid grid-cols-8 grid-rows-8" style={{ "grid-area": "2 / 2 / 10 / 10" }}>
          <Index each={squares}>
            {(square, index) => {
              return (
                <ChessSquare
                  square={square()}
                  color={squareColor(index)}
                  player={player}
                  flip={flip}
                  piece={() => getSquarePiece(square())}
                  selected={() => getSquareSelected(square())}
                  lastMove={() => getSquareLastMove(square())}
                  validMove={() => getSquareValidMove(square())}
                  inCheck={() => getSquareInCheck(square())}
                  onClick={() => onSquareClick(square())}
                />
              );
            }}
          </Index>
        </div>

        {/* Right Rank Numbers */}
        <ChessCoordinates type="ranks" flip={flip} gridArea="2 / 10 / 10 / 11" />

        {/* Bottom File Letters */}
        <ChessCoordinates type="files" flip={flip} gridArea="10 / 2 / 11 / 10" />
      </div>
    </div>
  );
};

export const squares = ranks.flatMap((rank) => files.map((file) => `${file}${rank}` as Square));
