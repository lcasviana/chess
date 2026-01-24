import { NgClass } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, viewChild, ViewEncapsulation } from "@angular/core";
import type { Square } from "chess.js";

import type { ChessSquareColor, ChessSquareInCheck } from "../chess.types";
import { ChessService } from "../services/chess.service";
import { getAdjacentSquare } from "../utils/keyboard-navigation";
import { ChessPieceComponent } from "./chess-piece.component";

@Component({
  selector: "chess-square",
  template: `
    <div
      #squareRef
      [id]="square()"
      [tabIndex]="tabIndex()"
      role="gridcell"
      [attr.aria-selected]="isSelected()"
      [style.padding]="'15%'"
      class="relative inline-flex aspect-square items-center justify-center select-none hover:opacity-85 focus:outline-none focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-800"
      [ngClass]="{
        'bg-red-200/25': isInCheck() !== null,
        'animate-pulse': isInCheck() === 'check',
        'bg-amber-200/25': !isInCheck() && isLastMove(),
        'bg-stone-500': !isInCheck() && !isLastMove() && color() === 'light',
        'bg-stone-600': !isInCheck() && !isLastMove() && color() === 'dark',
        'cursor-pointer': isValidMove() || piece()?.color === chess.player(),
      }"
      [attr.aria-label]="ariaLabel()"
      (keydown)="onSquarePress($event)"
      (click)="chess.onSquareClick(square())"
    >
      @if (piece(); as p) {
        <div class="flex size-full items-center justify-center">
          <chess-piece [piece]="p" [selected]="isSelected()" [flip]="chess.flip()" />
        </div>
      }
      @if (isValidMove() && !piece()) {
        <div class="size-1/5 animate-pulse rounded-full bg-stone-50/50"></div>
      }
      @if (isValidMove() && piece()) {
        <div style="inset: 5%" class="absolute rounded-full border-4 border-stone-50/50 opacity-50"></div>
      }
    </div>
  `,
  host: { class: "contents" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgClass, ChessPieceComponent],
})
export class ChessSquareComponent {
  protected chess = inject(ChessService);

  square = input.required<Square>();
  color = input.required<ChessSquareColor>();

  private squareRef = viewChild<ElementRef<HTMLDivElement>>("squareRef");

  piece = computed(() => this.chess.board()[this.square()]);
  isSelected = computed(() => this.chess.selectedSquare() === this.square());
  isFocused = computed(() => this.chess.focusedSquare() === this.square());
  isValidMove = computed(() => this.chess.validMoves().includes(this.square()));
  isLastMove = computed(() => {
    const lastMove = this.chess.lastMove();
    return lastMove?.from === this.square() || lastMove?.to === this.square();
  });
  tabIndex = computed(() => (this.isFocused() ? 0 : -1));

  isInCheck = computed((): ChessSquareInCheck => {
    const piece = this.piece();
    if (piece?.type !== "k" || piece?.color !== this.chess.turn()) return null;
    if (this.chess.isCheckmate()) return "checkmate";
    if (this.chess.isCheck()) return "check";
    return null;
  });

  ariaLabel = computed(() => {
    const square = this.square();
    const piece = this.piece();
    const isSelected = this.isSelected();
    const isValidMove = this.isValidMove();

    const parts = [square.toUpperCase()];

    if (piece) {
      const colorName = piece.color === "w" ? "White" : "Black";
      const pieceNames: Record<string, string> = {
        p: "Pawn",
        n: "Knight",
        b: "Bishop",
        r: "Rook",
        q: "Queen",
        k: "King",
      };
      const pieceName = pieceNames[piece.type] || piece.type;
      parts.push(`${colorName} ${pieceName}`);
    } else {
      parts.push(isValidMove ? "valid move" : "empty");
    }

    if (isSelected) parts.push("selected");
    if (isValidMove && piece) parts.push("capturable");

    return parts.join(", ");
  });

  constructor() {
    effect(() => {
      if (this.isFocused()) {
        const ref = this.squareRef();
        if (ref) {
          ref.nativeElement.focus();
        }
      }
    });
  }

  onSquarePress(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.chess.onSquareClick(this.square());
      return;
    }

    const arrowMap: Record<string, "up" | "down" | "left" | "right" | undefined> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };

    const direction = arrowMap[event.key];
    if (!direction) return;

    event.preventDefault();
    const nextSquare = getAdjacentSquare(this.square(), direction, this.chess.flip());
    if (nextSquare) {
      this.chess.focusedSquare.set(nextSquare);
    }
  }
}
