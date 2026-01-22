import type { Color } from "chess.js";
import type { Accessor, Component, JSX } from "solid-js";
import { createEffect, For, Show } from "solid-js";

import { useChess } from "~/contexts/ChessContext";
import { falsy } from "~/utils/constants";

import type { ChessPieceType } from "./ChessPiece";
import { blackKing, ChessPiece, colorNames, colors, whiteKing } from "./ChessPiece";

export const ChessStart: Component = (): JSX.Element => {
  const { gameStarted, player, setPlayer, onGameStart } = useChess();

  let formRef: HTMLFormElement | undefined;

  createEffect(() => {
    if (!gameStarted() && formRef) {
      formRef.focus();
    }
  });

  return (
    <Show when={!gameStarted()}>
      <div class="fixed inset-0 z-10 flex items-center justify-center bg-black/25 backdrop-blur-xs">
        <form
          ref={formRef}
          tabIndex={-1}
          class="flex flex-col items-center gap-4 rounded-lg bg-stone-800 p-4 shadow-sm shadow-stone-600 focus:outline-none"
          onSubmit={(e: SubmitEvent): void => {
            e.preventDefault();
            onGameStart();
          }}
        >
          <h2 class="text-base/none font-bold text-white">Choose Your Color</h2>
          <fieldset class="flex gap-3 border-0 p-0">
            <legend class="sr-only">Choose Your Color</legend>
            <For each={colors}>
              {(color: Color): JSX.Element => (
                <label
                  class="flex cursor-pointer flex-col items-center gap-1 rounded-lg p-2 transition-all focus-within:z-10 focus-within:outline-4 focus-within:outline-offset-2 focus-within:outline-blue-400"
                  classList={{
                    "bg-stone-50/50 ring-2 ring-stone-600": player() === color,
                    "bg-transparent hover:bg-stone-50/10": player() !== color,
                  }}
                  aria-label={`Play As ${colorNames[color]}`}
                >
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    checked={player() === color}
                    onChange={(): void => setPlayer(color)}
                    class="sr-only"
                  />
                  <div class="aspect-square size-full max-h-[8dvh] max-w-[8dvw]">
                    <ChessPiece piece={colorPiece[color]} selected={falsy} flip={falsy} />
                  </div>
                </label>
              )}
            </For>
          </fieldset>
          <button
            type="submit"
            class="mt-1 cursor-pointer rounded-lg px-3 py-1 text-base font-bold transition-all"
            classList={{
              "bg-zinc-300 text-zinc-900 hover:bg-zinc-400": player() === "w",
              "bg-zinc-900 text-zinc-300 hover:bg-zinc-800": player() === "b",
            }}
            aria-label={`Start Game As ${colorNames[player()]}`}
          >
            Start Game
          </button>
        </form>
      </div>
    </Show>
  );
};

const colorPiece: Readonly<Record<Color, Accessor<ChessPieceType>>> = Object.freeze({ w: whiteKing, b: blackKing });
