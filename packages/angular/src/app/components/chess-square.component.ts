import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, viewChild, ViewEncapsulation } from "@angular/core";
import type { Square } from "chess.js";

import { getAdjacentSquare, type ChessSquareColor, type ChessSquareInCheck } from "@chess/shared";
import { ChessService } from "../services/chess.service";
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
      [class]="squareClassName()"
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
  imports: [ChessPieceComponent],
})
export class ChessSquareComponent {
  protected readonly chess = inject(ChessService);

  public readonly square = input.required<Square>();
  public readonly color = input.required<ChessSquareColor>();

  private readonly squareRef = viewChild<ElementRef<HTMLDivElement>>("squareRef");

  protected readonly piece = computed(() => this.chess.board()[this.square()]);

  protected readonly isSelected = computed((): boolean => this.chess.selectedSquare() === this.square());

  protected readonly isValidMove = computed((): boolean => this.chess.validMoves().includes(this.square()));

  private readonly isFocused = computed((): boolean => this.chess.focusedSquare() === this.square());

  protected readonly tabIndex = computed((): number => (this.isFocused() ? 0 : -1));

  private readonly isLastMove = computed((): boolean => {
    const lastMove = this.chess.lastMove();
    return lastMove?.from === this.square() || lastMove?.to === this.square();
  });

  private readonly isInCheck = computed((): ChessSquareInCheck => this.getIsInCheck(this.piece()));

  protected readonly ariaLabel = computed((): string => this.getAriaLabel(this.piece(), this.isSelected(), this.isValidMove()));

  protected readonly squareClassName = computed((): string => {
    const isInCheck = this.isInCheck();
    const isValidMove = this.isValidMove();
    const isLastMove = this.isLastMove();
    const piece = this.piece();
    const base =
      "relative inline-flex aspect-square items-center justify-center select-none hover:opacity-85 focus:outline-none focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-800";

    let bg: string;
    if (isInCheck !== null) {
      bg = "bg-red-200/25";
    } else if (isLastMove) {
      bg = "bg-amber-200/25";
    } else {
      bg = this.color() === "light" ? "bg-stone-500" : "bg-stone-600";
    }

    const pulse = isInCheck === "check" ? "animate-pulse" : "";
    const cursor = isValidMove || piece?.color === this.chess.player() ? "cursor-pointer" : "";

    return `${base} ${bg} ${pulse} ${cursor}`.trim();
  });

  private readonly focusEffect = effect(() => {
    if (this.isFocused()) {
      const ref = this.squareRef();
      if (ref) {
        ref.nativeElement.focus();
      }
    }
  });

  public onSquarePress(event: KeyboardEvent): void {
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

  private getIsInCheck(piece: ReturnType<typeof this.chess.board>[Square] | undefined): ChessSquareInCheck {
    if (piece?.type !== "k" || piece?.color !== this.chess.turn()) return null;
    if (this.chess.isCheckmate()) return "checkmate";
    if (this.chess.isCheck()) return "check";
    return null;
  }

  private getAriaLabel(piece: ReturnType<typeof this.chess.board>[Square] | undefined, isSelected: boolean, isValidMove: boolean): string {
    const square = this.square();
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
  }
}
