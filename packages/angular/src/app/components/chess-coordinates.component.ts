import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from "@angular/core";

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
    <div [style.grid-area]="gridArea()" [class]="containerClassName()">
      @for (label of coordinates(); track label) {
        <div [class]="labelClassName()">
          {{ label }}
        </div>
      }
    </div>
  `,
  host: { class: "contents" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ChessCoordinatesComponent {
  public readonly type = input.required<ChessCoordinatesType>();
  public readonly gridArea = input.required<string>();
  public readonly flip = input(false);

  protected readonly coordinates = computed(() => COORDINATES[this.type()]);

  protected readonly containerClassName = computed(() => {
    const base = "grid";
    const layout = this.type() === "files" ? "grid-cols-8 grid-rows-1" : "grid-cols-1 grid-rows-8";
    return `${base} ${layout}`;
  });

  protected readonly labelClassName = computed(() => {
    const base = "m-auto flex size-5 items-center justify-center text-sm font-semibold text-stone-50/50 select-none";
    const rotate = this.flip() ? "rotate-180" : "";
    return `${base} ${rotate}`.trim();
  });
}
