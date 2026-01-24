import { NgClass } from "@angular/common";
import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, viewChild, ViewEncapsulation } from "@angular/core";
import type { Color } from "chess.js";

import { COLOR_NAMES, type ChessPieceType } from "@chess/shared";
import { ChessService } from "../services/chess.service";
import { ChessPieceComponent } from "./chess-piece.component";

const COLORS: Color[] = ["w", "b"];

const WHITE_KING: ChessPieceType = { id: "white-king", color: "w", type: "k" };
const BLACK_KING: ChessPieceType = { id: "black-king", color: "b", type: "k" };
const COLOR_PIECE: Record<Color, ChessPieceType> = { w: WHITE_KING, b: BLACK_KING };

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
            @for (color of colors; track color) {
              <label
                class="flex cursor-pointer flex-col items-center gap-1 rounded-lg p-2 transition-all focus-within:z-10 focus-within:outline-4 focus-within:outline-offset-2 focus-within:outline-blue-400"
                [ngClass]="{
                  'bg-stone-50/50 ring-2 ring-stone-600': chess.player() === color,
                  'bg-transparent hover:bg-stone-50/10': chess.player() !== color,
                }"
                [attr.aria-label]="'Play As ' + COLOR_NAMES[color]"
              >
                <input
                  type="radio"
                  name="color"
                  [value]="color"
                  [checked]="chess.player() === color"
                  (change)="chess.setPlayer(color)"
                  class="sr-only"
                />
                <div class="aspect-square size-full max-h-[8dvh] max-w-[8dvw]">
                  <chess-piece [piece]="colorPiece[color]" [selected]="false" [flip]="false" />
                </div>
              </label>
            }
          </fieldset>
          <button
            type="submit"
            class="mt-1 cursor-pointer rounded-lg px-3 py-1 text-base font-bold transition-all"
            [ngClass]="{
              'bg-zinc-300 text-zinc-900 hover:bg-zinc-400': chess.player() === 'w',
              'bg-zinc-900 text-zinc-300 hover:bg-zinc-800': chess.player() === 'b',
            }"
            [attr.aria-label]="'Start Game As ' + COLOR_NAMES[chess.player()]"
          >
            Start Game
          </button>
        </form>
      </div>
    }
  `,
  host: { class: "contents" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgClass, ChessPieceComponent],
})
export class ChessStartComponent {
  protected chess = inject(ChessService);
  protected colors = COLORS;
  protected colorPiece = COLOR_PIECE;
  protected COLOR_NAMES = COLOR_NAMES;

  private formRef = viewChild<ElementRef<HTMLFormElement>>("formRef");

  constructor() {
    effect(() => {
      if (!this.chess.gameStarted()) {
        const ref = this.formRef();
        if (ref) {
          ref.nativeElement.focus();
        }
      }
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.chess.onGameStart();
  }
}
