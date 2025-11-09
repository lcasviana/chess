import type { ChessStore } from "~/stores/chess.store";
import { chessStore } from "~/stores/chess.store";

import { ChessBoard } from "./ChessBoard";
import { ChessCaptured } from "./ChessCaptured";
import { ChessStart } from "./ChessStart";

export const ChessGame = () => {
  const {
    gameStarted,
    onGameStart,
    player,
    setPlayer,
    flip,
    capturedPieces,
    getSquarePiece,
    getSquareSelected,
    getSquareLastMove,
    getSquareValidMove,
    getSquareInCheck,
    onSquareClick,
  }: ChessStore = chessStore();

  return (
    <div class="relative grid size-full place-content-center place-items-center overflow-auto">
      <ChessStart gameStarted={gameStarted} player={player} onPlayerSelect={setPlayer} onGameStart={onGameStart} />

      <ChessBoard
        player={player}
        flip={flip}
        getSquarePiece={getSquarePiece}
        getSquareSelected={getSquareSelected}
        getSquareLastMove={getSquareLastMove}
        getSquareValidMove={getSquareValidMove}
        getSquareInCheck={getSquareInCheck}
        onSquareClick={onSquareClick}
      />

      <ChessCaptured pieces={capturedPieces} player={player} flip={flip} />
    </div>
  );
};
