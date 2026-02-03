import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from "@angular/core";

import { COLOR_NAMES, PIECE_NAMES, type ChessPieceType } from "@chess/shared";

@Component({
  selector: "chess-piece",
  template: `
    <svg [id]="piece().id" [style.view-transition-name]="piece().id" [class]="svgClassName()" [attr.aria-label]="ariaLabel()" role="img">
      <use [attr.href]="'./chess.svg#' + piece().type" />
    </svg>
  `,
  host: { class: "contents" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ChessPieceComponent {
  public readonly piece = input.required<ChessPieceType>();
  public readonly selected = input(false);
  public readonly flip = input(false);

  protected readonly ariaLabel = computed(() => `${COLOR_NAMES[this.piece().color]} ${PIECE_NAMES[this.piece().type]}`);

  protected readonly svgClassName = computed(() => {
    const isWhite = this.piece().color === "w";
    const base = "size-full drop-shadow-xs transition-all duration-200";
    const color = isWhite ? "fill-zinc-300 drop-shadow-zinc-900" : "fill-zinc-900 drop-shadow-zinc-300";
    const scale = this.selected() ? "scale-125" : "";
    const rotate = this.flip() ? "rotate-180" : "";
    return `${base} ${color} ${scale} ${rotate}`.trim();
  });
}
