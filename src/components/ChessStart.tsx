import type { Color } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";
import { For, Show } from "solid-js";

import { useChess } from "~/contexts/ChessContext";
import { falsy } from "~/utils/constants";

import type { ChessPieceType } from "./ChessPiece";
import { ChessPiece, colorNames, colors } from "./ChessPiece";

export const ChessStart: Component = (): JSX.Element => {
  const { gameStarted, player, setPlayer, onGameStart } = useChess();
  return (
    <Show when={!gameStarted()}>
      <div class="fixed inset-0 z-10 flex items-center justify-center bg-black/25 backdrop-blur-xs">
        <div class="flex flex-col items-center gap-4 rounded-lg bg-stone-800 p-4 shadow-sm shadow-stone-600">
          <h2 class="text-base/none font-bold text-white">Choose Your Color</h2>
          <div class="flex gap-3" role="group" aria-label="Color Selection">
            <For each={colors}>
              {(color: Color): JSX.Element => (
                <button
                  class="flex cursor-pointer flex-col items-center gap-1 rounded-lg p-2 transition-all"
                  classList={{
                    "bg-stone-50/50 ring-2 ring-stone-600": player() === color,
                    "bg-transparent hover:bg-stone-50/10": player() !== color,
                  }}
                  aria-label={`Play As ${colorNames[color]}`}
                  aria-pressed={player() === color}
                  onClick={(): void => setPlayer(color)}
                >
                  <div class="aspect-square size-full max-h-[8dvh] max-w-[8dvw]">
                    <ChessPiece piece={colorPiece[color]} selected={falsy} flip={falsy} />
                  </div>
                </button>
              )}
            </For>
          </div>
          <button
            class="mt-1 cursor-pointer rounded-lg px-3 py-1 text-base font-bold transition-all"
            classList={{
              "bg-zinc-300 text-zinc-900 hover:bg-zinc-400": player() === "w",
              "bg-zinc-900 text-zinc-300 hover:bg-zinc-800": player() === "b",
            }}
            aria-label={`Start Game As ${colorNames[player()]}`}
            onClick={onGameStart}
          >
            Start Game
          </button>
        </div>
      </div>
    </Show>
  );
};

const whiteKing: Accessor<ChessPieceType> = (): ChessPieceType => ({ id: "", color: "w", type: "k" });
const blackKing: Accessor<ChessPieceType> = (): ChessPieceType => ({ id: "", color: "b", type: "k" });
const colorPiece: Readonly<Record<Color, Accessor<ChessPieceType>>> = Object.freeze({ w: whiteKing, b: blackKing });
