import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from "@angular/core";

import { PIECE_VALUES, type ChessPieceType } from "@chess/shared";

import { ChessService } from "../services/chess.service";
import { ChessPieceComponent } from "./chess-piece.component";

@Component({
  selector: "chess-captured",
  template: `
    <div [class]="containerClassName()">
      <div class="flex flex-wrap items-center">
        @for (piece of whiteCaptured(); track piece.id) {
          <div class="size-5">
            <chess-piece [piece]="piece" [selected]="false" [flip]="false" />
          </div>
        }
      </div>
      <div [class]="pointsContainerClassName()">
        @if (points() !== 0) {
          <span [class]="pointsTextClassName()">+{{ absPoints() }}</span>
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
  imports: [ChessPieceComponent],
})
export class ChessCapturedComponent {
  protected readonly chess = inject(ChessService);

  protected readonly whiteCaptured = computed((): ChessPieceType[] => this.sortPieces(this.chess.capturedPieces().filter((p) => p.color === "b")));

  protected readonly blackCaptured = computed((): ChessPieceType[] =>
    this.sortPieces(this.chess.capturedPieces().filter((p) => p.color === "w")).reverse(),
  );

  protected readonly points = computed((): number => this.calculatePoints(this.whiteCaptured()) - this.calculatePoints(this.blackCaptured()));

  protected readonly absPoints = computed((): number => Math.abs(this.points()));

  protected readonly containerClassName = computed((): string => {
    const base = "flex h-6 w-full items-center justify-between gap-1 overflow-auto px-1";
    const scale = this.chess.flip() ? "-scale-x-100" : "";
    return `${base} ${scale}`.trim();
  });

  protected readonly pointsContainerClassName = computed((): string => {
    const points = this.points();
    if (points > 0) return "grow text-left";
    if (points < 0) return "grow text-right";
    return "grow";
  });

  protected readonly pointsTextClassName = computed((): string => {
    const points = this.points();
    const isPlayerAdvantage = this.chess.player() === "w" ? points > 0 : points < 0;
    const base = "inline-block text-base font-semibold";
    const color = isPlayerAdvantage ? "text-green-800" : "text-red-800";
    const scale = this.chess.flip() ? "-scale-x-100" : "";
    return `${base} ${color} ${scale}`.trim();
  });

  private calculatePoints(pieces: ChessPieceType[]): number {
    return pieces.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0);
  }

  private sortPieces(pieces: ChessPieceType[]): ChessPieceType[] {
    return Array.from(pieces).sort((a, b) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type]);
  }
}
