import type { Accessor, Component, JSX } from "solid-js";
import { createMemo, For, Show } from "solid-js";

import { PIECE_VALUES, type ChessPieceType } from "@chess/shared";
import { useChess } from "~/contexts/ChessContext";
import { falsy } from "~/utils/constants";
import { ChessPiece } from "./ChessPiece";

export const ChessCaptured: Component = (): JSX.Element => {
  const { capturedPieces, player, flip } = useChess();
  const whiteCaptured: Accessor<ChessPieceType[]> = createMemo((): ChessPieceType[] =>
    sortPieces(capturedPieces().filter(({ color }: ChessPieceType): boolean => color === "b")),
  );
  const blackCaptured: Accessor<ChessPieceType[]> = createMemo((): ChessPieceType[] =>
    sortPieces(capturedPieces().filter(({ color }: ChessPieceType): boolean => color === "w")).reverse(),
  );
  const whitePoints: Accessor<number> = createMemo((): number => calculatePoints(whiteCaptured()));
  const blackPoints: Accessor<number> = createMemo((): number => calculatePoints(blackCaptured()));
  const points: Accessor<number> = createMemo((): number => whitePoints() - blackPoints());
  return (
    <div class="flex h-6 w-full items-center justify-between gap-1 overflow-auto px-1" classList={{ "-scale-x-100": flip() }}>
      <ChessCapturedPieces pieces={whiteCaptured} />
      <div class="grow" classList={{ "text-left": points() > 0, "text-right": points() < 0 }}>
        <Show when={points()}>
          {(points: Accessor<number>): JSX.Element => (
            <span
              class="inline-block text-base font-semibold"
              classList={{
                "text-green-800": player() === "w" ? points() > 0 : points() < 0,
                "text-red-800": player() === "w" ? points() < 0 : points() > 0,
                "-scale-x-100": flip(),
              }}
            >
              +{Math.abs(points())}
            </span>
          )}
        </Show>
      </div>
      <ChessCapturedPieces pieces={blackCaptured} />
    </div>
  );
};

export type ChessCapturedPiecesProps = {
  pieces: Accessor<ChessPieceType[]>;
};

const ChessCapturedPieces: Component<ChessCapturedPiecesProps> = ({ pieces }: ChessCapturedPiecesProps): JSX.Element => {
  return (
    <div class="flex flex-wrap items-center">
      <For each={pieces()} fallback={<></>}>
        {(piece: ChessPieceType): JSX.Element => (
          <div class="size-5">
            <ChessPiece piece={(): ChessPieceType => piece} selected={falsy} flip={falsy} />
          </div>
        )}
      </For>
    </div>
  );
};

function calculatePoints(pieces: ChessPieceType[]): number {
  return pieces.reduce((sum: number, piece: ChessPieceType): number => sum + PIECE_VALUES[piece.type], 0);
}

function sortPieces(pieces: ChessPieceType[]): ChessPieceType[] {
  return Array.from(pieces).sort((a: ChessPieceType, b: ChessPieceType): number => PIECE_VALUES[b.type] - PIECE_VALUES[a.type]);
}
