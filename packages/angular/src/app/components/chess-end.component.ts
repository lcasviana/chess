import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from "@angular/core";

import { COLOR_NAMES, type ChessPieceType, type GameResult } from "@chess/shared";

import { ChessService } from "../services/chess.service";
import { ChessPieceComponent } from "./chess-piece.component";

const WHITE_KING: ChessPieceType = { id: "white-king", color: "w", type: "k" };
const BLACK_KING: ChessPieceType = { id: "black-king", color: "b", type: "k" };

@Component({
  selector: "chess-end",
  template: `
    @if (chess.isGameOver()) {
      <div class="fixed inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-xs">
        <div class="flex flex-col items-center gap-3 rounded-lg bg-stone-800 p-4 pt-3 shadow-sm shadow-stone-600">
          <h2 class="text-base/normal font-bold text-white">{{ resultMessage() }}</h2>
          <div class="size-16">
            <chess-piece [piece]="resultPlayer()" [selected]="false" [flip]="false" />
          </div>
          <button [class]="buttonClassName()" aria-label="Play Again" (click)="chess.resetGame()">Play Again</button>
        </div>
      </div>
    }
  `,
  host: { class: "contents" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ChessPieceComponent],
})
export class ChessEndComponent {
  protected readonly chess = inject(ChessService);

  private readonly result = computed((): GameResult => this.getResult());

  protected readonly resultMessage = computed((): string => this.getResultMessage(this.result()));

  protected readonly resultPlayer = computed((): ChessPieceType => this.getResultPlayer(this.result()));

  protected readonly buttonClassName = computed((): string =>
    this.chess.player() === "w"
      ? "mt-1 cursor-pointer rounded-lg px-3 py-1 text-base font-bold transition-all bg-zinc-300 text-zinc-900 hover:bg-zinc-400"
      : "mt-1 cursor-pointer rounded-lg px-3 py-1 text-base font-bold transition-all bg-zinc-900 text-zinc-300 hover:bg-zinc-800",
  );

  private getResult(): GameResult {
    if (this.chess.isCheckmate()) {
      const isPlayerWin = this.chess.turn() !== this.chess.player();
      return {
        type: isPlayerWin ? "win" : "lose",
        player: isPlayerWin ? this.chess.player() : this.chess.turn(),
      };
    }
    if (this.chess.isStalemate()) {
      return { type: "stalemate", player: null };
    }
    if (this.chess.isDraw() || this.chess.isThreefoldRepetition() || this.chess.isInsufficientMaterial()) {
      return { type: "draw", player: null };
    }
    return { type: "draw", player: null };
  }

  private getResultMessage(result: GameResult): string {
    switch (result.type) {
      case "win":
      case "lose":
        return `Checkmate! ${COLOR_NAMES[result.player!]} Wins!`;
      case "stalemate":
        return "Stalemate!";
      case "draw":
        if (this.chess.isThreefoldRepetition()) return "Draw by Threefold Repetition!";
        if (this.chess.isInsufficientMaterial()) return "Draw by Insufficient Material!";
        return "Draw!";
    }
  }

  private getResultPlayer(result: GameResult): ChessPieceType {
    switch (result.player) {
      case "w":
        return WHITE_KING;
      case "b":
        return BLACK_KING;
      default:
        return this.chess.player() === "w" ? WHITE_KING : BLACK_KING;
    }
  }
}
