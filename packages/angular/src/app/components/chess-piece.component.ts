import { NgClass } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from "@angular/core";

import type { ChessPieceType } from "../chess.types";
import { COLOR_NAMES, PIECE_NAMES } from "../chess.types";

@Component({
  selector: "chess-piece",
  template: `
    <svg
      [id]="piece().id"
      [style.view-transition-name]="piece().id"
      class="size-full drop-shadow-xs transition-all duration-200"
      [ngClass]="{
        'fill-zinc-300 drop-shadow-zinc-900': piece().color === 'w',
        'fill-zinc-900 drop-shadow-zinc-300': piece().color === 'b',
        'scale-125': selected(),
        'rotate-180': flip(),
      }"
      [attr.aria-label]="COLOR_NAMES[piece().color] + ' ' + PIECE_NAMES[piece().type]"
      role="img"
    >
      <use [attr.href]="'./chess.svg#' + piece().type" />
    </svg>
  `,
  host: { class: "contents" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgClass],
})
export class ChessPieceComponent {
  piece = input.required<ChessPieceType>();
  selected = input(false);
  flip = input(false);

  protected readonly COLOR_NAMES = COLOR_NAMES;
  protected readonly PIECE_NAMES = PIECE_NAMES;
}
