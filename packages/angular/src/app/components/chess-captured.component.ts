import { NgClass } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from "@angular/core";

import type { ChessPieceType } from "../chess.types";
import { PIECE_VALUES } from "../chess.types";
import { ChessService } from "../services/chess.service";
import { ChessPieceComponent } from "./chess-piece.component";

@Component({
  selector: "chess-captured",
  template: `
    <div class="flex h-6 w-full items-center justify-between gap-1 overflow-auto px-1" [ngClass]="{ '-scale-x-100': chess.flip() }">
      <div class="flex flex-wrap items-center">
        @for (piece of whiteCaptured(); track piece.id) {
          <div class="size-5">
            <chess-piece [piece]="piece" [selected]="false" [flip]="false" />
          </div>
        }
      </div>
      <div class="grow" [ngClass]="{ 'text-left': points() > 0, 'text-right': points() < 0 }">
        @if (points() !== 0) {
          <span
            class="inline-block text-base font-semibold"
            [ngClass]="{
              'text-green-800': chess.player() === 'w' ? points() > 0 : points() < 0,
              'text-red-800': chess.player() === 'w' ? points() < 0 : points() > 0,
              '-scale-x-100': chess.flip(),
            }"
          >
            +{{ absPoints() }}
          </span>
        }
      </div>
      <div class="flex flex-wrap items-center">
        @for (piece of blackCaptured(); track piece.id) {
          <div class="size-5">
            <chess-piece [piece]="piece" [selected]="false" [flip]="false" />
          </div>
        }
      </div>
    </div>
  `,
  host: { class: "contents" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgClass, ChessPieceComponent],
})
export class ChessCapturedComponent {
  protected chess = inject(ChessService);

  whiteCaptured = computed(() => this.sortPieces(this.chess.capturedPieces().filter((p) => p.color === "b")));

  blackCaptured = computed(() => this.sortPieces(this.chess.capturedPieces().filter((p) => p.color === "w")).reverse());

  whitePoints = computed(() => this.calculatePoints(this.whiteCaptured()));
  blackPoints = computed(() => this.calculatePoints(this.blackCaptured()));
  points = computed(() => this.whitePoints() - this.blackPoints());
  absPoints = computed(() => Math.abs(this.points()));

  private calculatePoints(pieces: ChessPieceType[]): number {
    return pieces.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0);
  }

  private sortPieces(pieces: ChessPieceType[]): ChessPieceType[] {
    return Array.from(pieces).sort((a, b) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type]);
  }
}
