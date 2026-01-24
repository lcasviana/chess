import { NgClass } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from "@angular/core";

export type ChessCoordinatesType = "files" | "ranks";

export const FILES: readonly string[] = Object.freeze(["a", "b", "c", "d", "e", "f", "g", "h"]);
export const RANKS: readonly number[] = Object.freeze([8, 7, 6, 5, 4, 3, 2, 1]);
export const COORDINATES: Readonly<Record<ChessCoordinatesType, readonly (number | string)[]>> = Object.freeze({
  files: FILES,
  ranks: RANKS,
});

@Component({
  selector: "chess-coordinates",
  template: `
    <div
      [style.grid-area]="gridArea()"
      class="grid"
      [ngClass]="{
        'grid-cols-8 grid-rows-1': type() === 'files',
        'grid-cols-1 grid-rows-8': type() === 'ranks',
      }"
    >
      @for (label of coordinates; track label) {
        <div
          class="m-auto flex size-5 items-center justify-center text-sm font-semibold text-stone-50/50 select-none"
          [ngClass]="{ 'rotate-180': flip() }"
        >
          {{ label }}
        </div>
      }
    </div>
  `,
  host: { class: "contents" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgClass],
})
export class ChessCoordinatesComponent {
  type = input.required<ChessCoordinatesType>();
  gridArea = input.required<string>();
  flip = input(false);

  get coordinates(): readonly (number | string)[] {
    return COORDINATES[this.type()];
  }
}
