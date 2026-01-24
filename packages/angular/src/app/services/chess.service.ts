import { Injectable, computed, signal } from "@angular/core";
import type { Color, Square } from "chess.js";
import { Chess } from "chess.js";

import { FILES, type ChessPieceType, type ChessSquareColor, type LastMove } from "@chess/shared";
import { ChessBotWorkerManager } from "./chess-bot-worker-manager";

@Injectable({ providedIn: "root" })
export class ChessService {
  private chess = new Chess();
  private pieceIdCounter = 1;
  private pieceIdMap = new Map<Square, string>();
  private botWorkerManager = new ChessBotWorkerManager();

  // Game state signals
  readonly gameStarted = signal(false);
  readonly player = signal<Color>("w");
  readonly board = signal<Record<Square, ChessPieceType | null>>({} as Record<Square, ChessPieceType | null>);
  readonly selectedSquare = signal<Square | null>(null);
  readonly focusedSquare = signal<Square | null>(null);
  readonly validMoves = signal<Square[]>([]);
  readonly lastMove = signal<LastMove | null>(null);
  readonly capturedPieces = signal<ChessPieceType[]>([]);
  readonly turn = signal<Color>("w");
  readonly isCheck = signal(false);
  readonly isCheckmate = signal(false);
  readonly isGameOver = signal(false);
  readonly isDraw = signal(false);
  readonly isStalemate = signal(false);
  readonly isThreefoldRepetition = signal(false);
  readonly isInsufficientMaterial = signal(false);

  // Computed signals
  readonly flip = computed(() => this.player() === "b");

  constructor() {
    this.initializeBoard();
  }

  private generatePieceId(): string {
    return `p${this.pieceIdCounter++}`;
  }

  private initializeBoard(): void {
    const boardState = this.initializeBoardFromChess();
    this.board.set(boardState);
    this.turn.set(this.chess.turn());
  }

  private initializeBoardFromChess(): Record<Square, ChessPieceType | null> {
    const boardState: Record<string, ChessPieceType | null> = {};
    const chessBoard = this.chess.board();

    chessBoard.forEach((row, rankIndex) => {
      row.forEach((piece, fileIndex) => {
        const square = `${FILES[fileIndex]}${8 - rankIndex}` as Square;
        if (piece) {
          const id = this.generatePieceId();
          this.pieceIdMap.set(square, id);
          boardState[square] = { ...piece, id };
        } else {
          boardState[square] = null;
        }
      });
    });

    return boardState as Record<Square, ChessPieceType | null>;
  }

  private getRookSquaresForCastling(move: { flags: string; color: Color; to: Square }): { from: Square; to: Square } | null {
    const isKingside = move.flags.includes("k");
    const isQueenside = move.flags.includes("q");

    if (!isKingside && !isQueenside) return null;

    const rank = move.color === "w" ? "1" : "8";

    if (isKingside) {
      return { from: `h${rank}` as Square, to: `f${rank}` as Square };
    } else {
      return { from: `a${rank}` as Square, to: `d${rank}` as Square };
    }
  }

  private withViewTransition(callback: () => void): void {
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(callback);
    } else {
      callback();
    }
  }

  private updateGameStateSignals(): void {
    this.turn.set(this.chess.turn());
    this.isCheck.set(this.chess.isCheck());
    this.isCheckmate.set(this.chess.isCheckmate());
    this.isGameOver.set(this.chess.isGameOver());
    this.isDraw.set(this.chess.isDraw());
    this.isStalemate.set(this.chess.isStalemate());
    this.isThreefoldRepetition.set(this.chess.isThreefoldRepetition());
    this.isInsufficientMaterial.set(this.chess.isInsufficientMaterial());
  }

  private updatePiecePositions(from: Square, to: Square, move: { flags: string; color: Color; to: Square }): void {
    const movingPieceId = this.pieceIdMap.get(from);
    if (movingPieceId) {
      this.pieceIdMap.delete(from);
      this.pieceIdMap.set(to, movingPieceId);
    }

    const rookSquares = this.getRookSquaresForCastling(move);
    if (rookSquares) {
      const rookId = this.pieceIdMap.get(rookSquares.from);
      if (rookId) {
        this.pieceIdMap.delete(rookSquares.from);
        this.pieceIdMap.set(rookSquares.to, rookId);
      }
    }
  }

  private syncBoardToStore(): void {
    const chessBoard = this.chess.board();
    const _board = {} as Record<Square, ChessPieceType | null>;
    const currentSquares = new Set<Square>();

    chessBoard.forEach((row, rankIndex) => {
      row.forEach((piece, fileIndex) => {
        const square = `${FILES[fileIndex]}${8 - rankIndex}` as Square;
        if (piece) {
          currentSquares.add(square);
          let id = this.pieceIdMap.get(square);
          if (!id) {
            id = this.generatePieceId();
            this.pieceIdMap.set(square, id);
          }
          _board[square] = { ...piece, id };
        } else {
          _board[square] = null;
        }
      });
    });

    for (const [square] of this.pieceIdMap) {
      if (!currentSquares.has(square)) {
        this.pieceIdMap.delete(square);
      }
    }

    this.board.set(_board);
  }

  private syncGameState(): void {
    this.updateGameStateSignals();
    if (!this.chess.isGameOver() && this.chess.turn() !== this.player()) {
      setTimeout(() => this.makeComputerMove(), 500);
    }
  }

  private async makeComputerMove(): Promise<void> {
    if (this.chess.isGameOver() || this.chess.turn() === this.player()) return;

    try {
      const move = await this.botWorkerManager.getBestMove(this.chess.fen());

      if (move) {
        const capturedPieceId = this.pieceIdMap.get(move.to as Square);
        const result = this.chess.move(move);

        if (result) {
          this.withViewTransition(() => {
            this.updatePiecePositions(move.from as Square, move.to as Square, result);
            this.syncBoardToStore();
            this.updateGameStateSignals();
            this.lastMove.set({ from: move.from as Square, to: move.to as Square });
            if (result.captured && capturedPieceId) {
              this.capturedPieces.update((prev) => [
                ...prev,
                { id: capturedPieceId, color: result.color === "w" ? "b" : "w", type: result.captured! },
              ]);
            }
          });
        }
      }
    } catch (error) {
      console.error("[Bot] Error making move:", error);
    }
  }

  getSquareColor(square: Square): ChessSquareColor {
    return this.chess.squareColor(square);
  }

  onGameStart(): void {
    this.gameStarted.set(true);
    const initialSquare = this.player() === "w" ? "e2" : "d7";
    this.focusedSquare.set(initialSquare as Square);
    if (this.player() === "b") {
      setTimeout(() => this.makeComputerMove(), 500);
    }
  }

  onSquareClick(square: Square): void {
    if (this.isGameOver() || this.turn() !== this.player()) return;

    const clickedPiece = this.board()[square];
    const currentSelection = this.selectedSquare();

    if (!currentSelection) {
      if (!clickedPiece || clickedPiece.color !== this.player()) return;
      this.selectedSquare.set(square);
      this.validMoves.set(this.chess.moves({ square, verbose: true }).map((m) => m.to as Square));
      return;
    }

    if (currentSelection === square) {
      this.selectedSquare.set(null);
      this.validMoves.set([]);
      return;
    }

    if (clickedPiece && clickedPiece.color === this.player()) {
      this.selectedSquare.set(square);
      this.validMoves.set(this.chess.moves({ square, verbose: true }).map((m) => m.to as Square));
      return;
    }

    if (this.validMoves().includes(square)) {
      try {
        const piece = this.board()[currentSelection];
        const isPawnPromotion = piece?.type === "p" && ((piece.color === "w" && square[1] === "8") || (piece.color === "b" && square[1] === "1"));
        const capturedPieceId = this.pieceIdMap.get(square);

        const move = this.chess.move({
          from: currentSelection,
          to: square,
          promotion: isPawnPromotion ? "q" : undefined,
        });

        if (move) {
          this.withViewTransition(() => {
            this.updatePiecePositions(currentSelection, square, move);
            this.syncBoardToStore();
            this.syncGameState();
            this.lastMove.set({ from: currentSelection, to: square });
            this.focusedSquare.set(square);
            if (move.captured && capturedPieceId) {
              this.capturedPieces.update((prev) => [...prev, { id: capturedPieceId, color: move.color === "w" ? "b" : "w", type: move.captured! }]);
            }
            this.selectedSquare.set(null);
            this.validMoves.set([]);
          });
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      this.selectedSquare.set(null);
      this.validMoves.set([]);
    }
  }

  resetGame(): void {
    this.chess.reset();
    this.pieceIdCounter = 1;
    this.pieceIdMap.clear();

    this.gameStarted.set(false);
    this.capturedPieces.set([]);
    this.selectedSquare.set(null);
    this.focusedSquare.set(null);
    this.lastMove.set(null);
    this.validMoves.set([]);
    this.board.set(this.initializeBoardFromChess());
    this.turn.set(this.chess.turn());
    this.isCheck.set(false);
    this.isCheckmate.set(false);
    this.isGameOver.set(false);
    this.isDraw.set(false);
    this.isStalemate.set(false);
    this.isThreefoldRepetition.set(false);
    this.isInsufficientMaterial.set(false);
  }

  setPlayer(color: Color): void {
    this.player.set(color);
  }
}
