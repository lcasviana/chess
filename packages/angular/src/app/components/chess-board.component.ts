import { NgClass } from "@angular/common";
import { ChangeDetectionStrategy, Component, effect, inject, signal, ViewEncapsulation } from "@angular/core";
import { SQUARES, type Square } from "chess.js";

import { ChessService } from "../services/chess.service";
import { ChessCoordinatesComponent } from "./chess-coordinates.component";
import { ChessSquareComponent } from "./chess-square.component";

@Component({
  selector: "chess-board",
  template: `
    <div class="grid aspect-square size-full overflow-auto bg-stone-800 shadow-sm shadow-neutral-950">
      <div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
        {{ announcement() }}
      </div>
      <div
        style="grid-template: auto repeat(8, 1fr) auto / auto repeat(8, 1fr) auto"
        class="grid aspect-square size-full max-h-dvh max-w-dvw overflow-auto"
        [ngClass]="{ 'rotate-180': chess.flip() }"
      >
        <chess-coordinates aria-label="Top File Letters" type="files" [flip]="chess.flip()" gridArea="1 / 2 / 2 / 10" />
        <chess-coordinates aria-label="Left Rank Numbers" type="ranks" [flip]="chess.flip()" gridArea="2 / 1 / 10 / 2" />
        <div
          role="grid"
          aria-label="Chess Board"
          aria-rowcount="8"
          aria-colcount="8"
          class="grid grid-cols-8 grid-rows-8"
          style="grid-area: 2 / 2 / 10 / 10"
        >
          @for (square of squares; track square) {
            <chess-square [square]="square" [color]="chess.getSquareColor(square)" />
          }
        </div>
        <chess-coordinates aria-label="Right Rank Numbers" type="ranks" [flip]="chess.flip()" gridArea="2 / 10 / 10 / 11" />
        <chess-coordinates aria-label="Bottom File Letters" type="files" [flip]="chess.flip()" gridArea="10 / 2 / 11 / 10" />
      </div>
    </div>
  `,
  host: { class: "contents" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgClass, ChessCoordinatesComponent, ChessSquareComponent],
})
export class ChessBoardComponent {
  protected chess = inject(ChessService);
  protected squares: Square[] = [...SQUARES];
  protected announcement = signal("");

  private pieceNames: Record<string, string> = {
    p: "Pawn",
    n: "Knight",
    b: "Bishop",
    r: "Rook",
    q: "Queen",
    k: "King",
  };

  constructor() {
    effect(() => {
      const move = this.chess.lastMove();
      if (!move) return;

      const piece = this.chess.board()[move.to];
      if (!piece) return;

      const colorName = this.chess.turn() === "w" ? "Black" : "White";
      const pieceName = this.pieceNames[piece.type];

      let text = `${colorName} ${pieceName} from ${move.from.toUpperCase()} to ${move.to.toUpperCase()}`;
      if (this.chess.isCheckmate()) text += ". Checkmate!";
      else if (this.chess.isCheck()) text += ". Check!";

      this.announcement.set(text);
    });
  }
}
