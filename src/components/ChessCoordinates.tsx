import type { Accessor, Component } from "solid-js";
import { For } from "solid-js";

export type ChessCoordinatesType = "files" | "ranks";

export type ChessCoordinatesProps = {
  type: ChessCoordinatesType;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
  flip: Accessor<boolean>;
};

export const ChessCoordinates: Component<ChessCoordinatesProps> = ({ type, rowStart, rowEnd, colStart, colEnd, flip }) => {
  return (
    <div
      class="grid"
      classList={{
        "grid-rows-1 grid-cols-8": type === "files",
        "grid-rows-8 grid-cols-1": type === "ranks",
        "rotate-180": flip(),
      }}
      style={{
        "grid-row-start": rowStart,
        "grid-row-end": rowEnd,
        "grid-column-start": colStart,
        "grid-column-end": colEnd,
      }}
    >
      <For each={coordinates[type]}>
        {(label) => <div class="flex size-full items-center justify-center text-sm font-semibold text-stone-50/50">{label}</div>}
      </For>
    </div>
  );
};

export const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const ranks = [1, 2, 3, 4, 5, 6, 7, 8].reverse();
export const coordinates: Record<ChessCoordinatesType, number[] | string[]> = { files, ranks };
