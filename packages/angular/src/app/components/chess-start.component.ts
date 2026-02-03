import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, viewChild, ViewEncapsulation } from "@angular/core";
import type { Color } from "chess.js";

import { COLOR_NAMES, type ChessPieceType } from "@chess/shared";
import { ChessService } from "../services/chess.service";
import { ChessPieceComponent } from "./chess-piece.component";

const WHITE_KING: ChessPieceType = { id: "white-king", color: "w", type: "k" };
const BLACK_KING: ChessPieceType = { id: "black-king", color: "b", type: "k" };
const COLOR_PIECE: Readonly<Record<Color, ChessPieceType>> = { w: WHITE_KING, b: BLACK_KING };

@Component({
  selector: "chess-start",
  template: `
    @if (!chess.gameStarted()) {
      <div class="fixed inset-0 z-10 flex items-center justify-center bg-black/25 backdrop-blur-xs">
        <form
          #formRef
          tabindex="-1"
          class="flex flex-col items-center gap-4 rounded-lg bg-stone-800 p-4 shadow-sm shadow-stone-600 focus:outline-none"
          (submit)="onSubmit($event)"
        >
          <h2 class="text-base/none font-bold text-white">Choose Your Color</h2>
          <fieldset class="flex gap-3 border-0 p-0">
            <legend class="sr-only">Choose Your Color</legend>
            <label
              class="flex cursor-pointer flex-col items-center gap-1 rounded-lg p-2 transition-all focus-within:z-10 focus-within:outline-4 focus-within:outline-offset-2 focus-within:outline-blue-400"
              [class]="whiteLabelClassName()"
              [attr.aria-label]="'Play As ' + colorNames.w"
            >
              <input type="radio" name="color" value="w" [checked]="chess.player() === 'w'" (change)="chess.setPlayer('w')" class="sr-only" />
              <div class="aspect-square size-full max-h-[8dvh] max-w-[8dvw]">
                <chess-piece [piece]="colorPiece.w" [selected]="false" [flip]="false" />
              </div>
            </label>
            <label
              class="flex cursor-pointer flex-col items-center gap-1 rounded-lg p-2 transition-all focus-within:z-10 focus-within:outline-4 focus-within:outline-offset-2 focus-within:outline-blue-400"
              [class]="blackLabelClassName()"
              [attr.aria-label]="'Play As ' + colorNames.b"
            >
              <input type="radio" name="color" value="b" [checked]="chess.player() === 'b'" (change)="chess.setPlayer('b')" class="sr-only" />
              <div class="aspect-square size-full max-h-[8dvh] max-w-[8dvw]">
                <chess-piece [piece]="colorPiece.b" [selected]="false" [flip]="false" />
              </div>
            </label>
          </fieldset>
          <button type="submit" [class]="buttonClassName()" [attr.aria-label]="'Start Game As ' + colorNames[chess.player()]">Start Game</button>
        </form>
      </div>
    }
  `,
  host: { class: "contents" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ChessPieceComponent],
})
export class ChessStartComponent {
  protected readonly chess = inject(ChessService);
  protected readonly colorPiece = COLOR_PIECE;
  protected readonly colorNames = COLOR_NAMES;

  private readonly formRef = viewChild<ElementRef<HTMLFormElement>>("formRef");

  protected readonly whiteLabelClassName = computed(() =>
    this.chess.player() === "w" ? "bg-stone-50/50 ring-2 ring-stone-600" : "bg-transparent hover:bg-stone-50/10",
  );

  protected readonly blackLabelClassName = computed(() =>
    this.chess.player() === "b" ? "bg-stone-50/50 ring-2 ring-stone-600" : "bg-transparent hover:bg-stone-50/10",
  );

  protected readonly buttonClassName = computed(() =>
    this.chess.player() === "w"
      ? "mt-1 cursor-pointer rounded-lg px-3 py-1 text-base font-bold transition-all bg-zinc-300 text-zinc-900 hover:bg-zinc-400"
      : "mt-1 cursor-pointer rounded-lg px-3 py-1 text-base font-bold transition-all bg-zinc-900 text-zinc-300 hover:bg-zinc-800",
  );

  private readonly focusEffect = effect(() => {
    if (!this.chess.gameStarted()) {
      const ref = this.formRef();
      if (ref) {
        ref.nativeElement.focus();
      }
    }
  });

  public onSubmit(event: Event): void {
    event.preventDefault();
    this.chess.onGameStart();
  }
}
