import type { Color, PieceSymbol, Square } from "chess.js";
import { Chess } from "chess.js";
import { createMemo, createSignal } from "solid-js";

import { findBestMove } from "~/lib/chess-bot";
import {
  getCapturedPieces,
  getPieceIdAtSquare,
  handleCastling,
  handleEnPassant,
  handlePieceMove,
  handlePromotion,
  initializePieceRegistry,
  type PieceRegistry,
} from "~/lib/piece-registry";

import { ChessBoard } from "./ChessBoard";
import { ChessCaptured } from "./ChessCaptured";
import type { ChessSquareInCheck } from "./ChessSquare";
import { ChessStart } from "./ChessStart";

interface GameHistoryEntry {
  fen: string;
  move: string;
  capturedPiece?: { type: PieceSymbol; color: Color };
  lastMove: { from: Square; to: Square } | null;
}

export const ChessGame = () => {
  const initialGame = new Chess();
  const [game, setGame] = createSignal(initialGame);
  const [pieceRegistry, setPieceRegistry] = createSignal<PieceRegistry>(initializePieceRegistry(initialGame));
  const [selectedSquare, setSelectedSquare] = createSignal<Square | null>(null);
  const [validMoves, setValidMoves] = createSignal<Square[]>([]);
  const [lastMove, setLastMove] = createSignal<{ from: Square; to: Square } | null>(null);
  const [isAiThinking, setIsAiThinking] = createSignal(false);
  const [gameHistory, setGameHistory] = createSignal<GameHistoryEntry[]>([
    { fen: initialGame.fen(), move: "Start", capturedPiece: undefined, lastMove: null },
  ]);
  const [currentMoveIndex, setCurrentMoveIndex] = createSignal(0);
  const [gameStarted, setGameStarted] = createSignal(false);
  const [player, setPlayer] = createSignal<Color>("w");

  const isViewingHistory = () => currentMoveIndex() < gameHistory().length - 1;

  // Detect if king is in check or checkmate
  const inCheck = createMemo((): { square: Square; type: ChessSquareInCheck } | null => {
    const currentGame = game();
    if (currentGame.isCheckmate()) {
      // Find the king's position
      const board = currentGame.board();
      const turn = currentGame.turn();
      for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
          const piece = board[rank][file];
          if (piece && piece.type === "k" && piece.color === turn) {
            const square = `${"abcdefgh"[file]}${8 - rank}` as Square;
            return { square, type: "checkmate" };
          }
        }
      }
    } else if (currentGame.isCheck()) {
      // Find the king's position
      const board = currentGame.board();
      const turn = currentGame.turn();
      for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
          const piece = board[rank][file];
          if (piece && piece.type === "k" && piece.color === turn) {
            const square = `${"abcdefgh"[file]}${8 - rank}` as Square;
            return { square, type: "check" };
          }
        }
      }
    }
    return null;
  });

  const capturedPieces = createMemo(() => {
    const captured = getCapturedPieces(pieceRegistry());
    return captured.map((p) => ({ type: p.type, color: p.color }));
  });

  const startGame = () => {
    setGameStarted(true);
    if (player() === "b") {
      // AI makes first move
      setTimeout(() => makeAiMove(), 500);
    }
  };

  const onSquareClick = (square: Square) => {
    if (isAiThinking() || isViewingHistory() || !gameStarted()) return;

    const expectedColor = player();
    if (game().turn() !== expectedColor) return;

    const piece = game().get(square);

    if (selectedSquare()) {
      if (validMoves().includes(square)) {
        const from = selectedSquare()!;
        const performMove = () => {
          try {
            const piece = game().get(from);
            if (!piece) return;

            const capturedPiece = game().get(square);
            const capturedPieceInfo = capturedPiece ? { type: capturedPiece.type, color: capturedPiece.color } : undefined;

            const move = game().move({
              from,
              to: square,
              promotion: "q",
            });

            if (move) {
              const registry = pieceRegistry();

              if (move.isEnPassant()) {
                const capturedPawnSquare = `${square[0]}${from[1]}` as Square;
                handleEnPassant(registry, { from, to: square }, capturedPawnSquare);
              } else {
                handlePieceMove(registry, from, square, capturedPieceInfo);
              }

              if (move.isKingsideCastle() || move.isQueensideCastle()) {
                handleCastling(registry, { from, to: square });
              }

              if (move.isPromotion() && move.promotion) {
                handlePromotion(registry, square, move.promotion);
              }

              setPieceRegistry({ ...registry });

              const newHistory = [
                ...gameHistory(),
                {
                  fen: game().fen(),
                  move: move.san,
                  capturedPiece: capturedPieceInfo,
                  lastMove: { from, to: square },
                },
              ];

              setGameHistory(newHistory);
              setCurrentMoveIndex(newHistory.length - 1);
              setLastMove({ from, to: square });
              setGame(game());

              setTimeout(() => makeAiMove(), 500);
            }
          } catch (e) {
            // Invalid move
          }
          setSelectedSquare(null);
          setValidMoves([]);
        };

        // Use View Transitions API if available
        if (document.startViewTransition) {
          document.startViewTransition(() => performMove());
        } else {
          performMove();
        }
      } else if (piece && piece.color === game().turn()) {
        setSelectedSquare(square);
        setValidMoves(
          game()
            .moves({ square, verbose: true })
            .map((m) => m.to as Square),
        );
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      if (piece && piece.color === game().turn()) {
        setSelectedSquare(square);
        const moves = game().moves({ square, verbose: true });
        setValidMoves(moves.map((m) => m.to as Square));
      }
    }
  };

  const makeAiMove = () => {
    setIsAiThinking(true);

    setTimeout(() => {
      const bestMoveSan = findBestMove(game(), 3);
      if (bestMoveSan) {
        // Execute the move once and extract all needed information
        const move = game().move(bestMoveSan);
        if (move) {
          const from = move.from;
          const to = move.to;
          const capturedPieceInfo = move.captured ? { type: move.captured, color: (move.color === "w" ? "b" : "w") as Color } : undefined;
          const performAiMove = () => {
            const registry = pieceRegistry();

            if (move.isEnPassant()) {
              const capturedPawnSquare = `${to[0]}${from[1]}` as Square;
              handleEnPassant(registry, { from, to }, capturedPawnSquare);
            } else {
              handlePieceMove(registry, from, to, capturedPieceInfo);
            }

            if (move.isKingsideCastle() || move.isQueensideCastle()) {
              handleCastling(registry, { from, to });
            }

            if (move.isPromotion() && move.promotion) {
              handlePromotion(registry, to, move.promotion);
            }

            setPieceRegistry({ ...registry });

            const newHistory = [
              ...gameHistory(),
              {
                fen: game().fen(),
                move: move.san,
                capturedPiece: capturedPieceInfo,
                lastMove: { from, to },
              },
            ];

            setGameHistory(newHistory);
            setCurrentMoveIndex(newHistory.length - 1);
            setLastMove({ from, to });
            setGame(game());
            setIsAiThinking(false);
          };

          // Use View Transitions API if available
          if (document.startViewTransition) {
            document.startViewTransition(() => performAiMove());
          } else {
            performAiMove();
          }
        } else {
          setIsAiThinking(false);
        }
      } else {
        setIsAiThinking(false);
      }
    }, 300);
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setPieceRegistry(initializePieceRegistry(newGame));
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setGameHistory([{ fen: newGame.fen(), move: "Start", capturedPiece: undefined, lastMove: null }]);
    setCurrentMoveIndex(0);
    setGameStarted(false);
  };

  const goToPreviousMove = () => {
    if (currentMoveIndex() > 0) {
      const newIndex = currentMoveIndex() - 1;
      const historyEntry = gameHistory()[newIndex];
      const newGame = new Chess(historyEntry.fen);
      setGame(newGame);
      setPieceRegistry(initializePieceRegistry(newGame));
      setCurrentMoveIndex(newIndex);
      setLastMove(historyEntry.lastMove);
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const goToNextMove = () => {
    if (currentMoveIndex() < gameHistory().length - 1) {
      const newIndex = currentMoveIndex() + 1;
      const historyEntry = gameHistory()[newIndex];
      const newGame = new Chess(historyEntry.fen);
      setGame(newGame);
      setPieceRegistry(initializePieceRegistry(newGame));
      setCurrentMoveIndex(newIndex);
      setLastMove(historyEntry.lastMove);
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const piece = (sq: Square) => {
    const piece = game().get(sq);
    const id = getPieceIdAtSquare(pieceRegistry(), sq);
    return id && piece ? { ...piece, id } : null;
  };

  const flip = createMemo(() => player() === "b");

  const getSquarePiece = (sq: Square) => piece(sq);

  const getSquareSelected = (sq: Square) => selectedSquare() === sq;

  const getSquareLastMove = (sq: Square) => {
    const move = lastMove();
    return move ? move.from === sq || move.to === sq : false;
  };

  const getSquareValidMove = (sq: Square) => validMoves().includes(sq);

  const getSquareInCheck = (sq: Square): ChessSquareInCheck | null => {
    const check = inCheck();
    return check && check.square === sq ? check.type : null;
  };

  return (
    <div class="relative grid size-full place-content-center place-items-center overflow-auto">
      <ChessStart gameStarted={gameStarted} player={player} onPlayerSelect={setPlayer} onStartGame={startGame} />

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
