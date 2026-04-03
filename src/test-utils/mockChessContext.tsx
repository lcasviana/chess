import type { Square } from "~/chess";
import type { ChessPieceType } from "~/components/ChessPiece";
import type { ChessSquareColor } from "~/components/ChessSquare";
import type { ChessStore } from "~/stores/chess.store";

export function createMockStore(overrides: Partial<ChessStore> = {}): ChessStore {
  return {
    gameStarted: () => false,
    onGameStart: () => {},
    player: () => "w",
    setPlayer: () => {},
    flip: () => false,
    board: () => ({}) as Record<Square, ChessPieceType | null>,
    selectedSquare: () => null,
    focusedSquare: () => null,
    setFocusedSquare: () => {},
    validMoves: () => [],
    lastMove: () => null,
    capturedPieces: () => [],
    getSquareColor: (): ChessSquareColor => null,
    onSquareClick: () => {},
    turn: () => "w",
    isCheck: () => false,
    isCheckmate: () => false,
    isGameOver: () => false,
    isDraw: () => false,
    isStalemate: () => false,
    isThreefoldRepetition: () => false,
    isInsufficientMaterial: () => false,
    resetGame: () => {},
    ...overrides,
  };
}
