import type { Accessor, Component, JSX } from "solid-js";
import { For } from "solid-js";

export type ChessCoordinatesType = "files" | "ranks";

export type ChessCoordinatesProps = {
  type: ChessCoordinatesType;
  gridArea: string;
  flip: Accessor<boolean>;
};

export const ChessCoordinates: Component<ChessCoordinatesProps> = ({ type, gridArea, flip }: ChessCoordinatesProps): JSX.Element => {
  return (
    <div
      style={{ "grid-area": gridArea }}
      class="grid"
      classList={{
        "grid-rows-1 grid-cols-8": type === "files",
        "grid-rows-8 grid-cols-1": type === "ranks",
      }}
    >
      <For each={coordinates[type]}>
        {(label: number | string): JSX.Element => (
          <div class="m-auto flex size-5 items-center justify-center text-sm font-semibold text-stone-50/50" classList={{ "rotate-180": flip() }}>
            {label}
          </div>
        )}
      </For>
    </div>
  );
};

export const files: Readonly<string[]> = Object.freeze(["a", "b", "c", "d", "e", "f", "g", "h"]);
export const ranks: Readonly<number[]> = Object.freeze([8, 7, 6, 5, 4, 3, 2, 1]);
export const coordinates: Readonly<Record<ChessCoordinatesType, Readonly<(number | string)[]>>> = Object.freeze({ files, ranks });
