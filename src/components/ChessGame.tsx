import { Chess, type PieceSymbol, type Square } from "chess.js";
import { createMemo, createSignal } from "solid-js";

import { findBestMove } from "~/lib/chess-ai";
import { type PieceRegistry, getCapturedPieces, handleCastling, handlePieceMove, initializePieceRegistry } from "~/lib/piece-registry";

import { ChessBoard } from "./ChessBoard";
import { ChessPiece } from "./ChessPiece";

interface GameHistoryEntry {
  fen: string;
  move: string;
  capturedPiece?: { type: PieceSymbol; color: "w" | "b" };
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
    { fen: new Chess().fen(), move: "Start", capturedPiece: undefined, lastMove: null },
  ]);
  const [currentMoveIndex, setCurrentMoveIndex] = createSignal(0);
  const [gameStarted, setGameStarted] = createSignal(false);
  const [playerColor, setPlayerColor] = createSignal<"w" | "b">("w");

  const isViewingHistory = () => currentMoveIndex() < gameHistory().length - 1;

  const calculatePoints = (pieces: { type: PieceSymbol; color: "w" | "b" }[]) => {
    const pieceValues: { [key in PieceSymbol]: number } = {
      p: 1,
      n: 3,
      b: 3,
      r: 5,
      q: 9,
      k: 0,
    };
    return pieces.reduce((sum, piece) => sum + (pieceValues[piece.type] || 0), 0);
  };

  const capturedPieces = createMemo(() => {
    const captured = getCapturedPieces(pieceRegistry());
    return {
      white: captured.white.map((p) => ({ type: p.type, color: p.color })),
      black: captured.black.map((p) => ({ type: p.type, color: p.color })),
    };
  });
  const whitePoints = createMemo(() => calculatePoints(capturedPieces().white));
  const blackPoints = createMemo(() => calculatePoints(capturedPieces().black));
  const pointDifference = createMemo(() => whitePoints() - blackPoints());

  const startGame = () => {
    setGameStarted(true);
    if (playerColor() === "b") {
      // AI makes first move
      setTimeout(() => makeAiMove(), 500);
    }
  };

  const handleSquareClick = (square: Square) => {
    if (isAiThinking() || isViewingHistory() || !gameStarted()) return;

    const expectedColor = playerColor();
    if (game().turn() !== expectedColor) return;

    const piece = game().get(square);

    if (selectedSquare()) {
      if (validMoves().includes(square)) {
        const from = selectedSquare()!;
        const performMove = () => {
          try {
            const piece = game().get(from);
            if (!piece) return;

            const move = game().move({
              from,
              to: square,
              promotion: "q",
            });

            if (move) {
              // Update piece registry
              const registry = pieceRegistry();
              handlePieceMove(registry, from, square, move.captured ? { type: move.captured, color: playerColor() === "w" ? "b" : "w" } : undefined);

              // Handle special moves - detect castling by king moving more than 1 square
              if (piece.type === "k" && Math.abs(from.charCodeAt(0) - square.charCodeAt(0)) > 1) {
                // Castling
                handleCastling(registry, { from, to: square });
              }

              setPieceRegistry({ ...registry });

              const newHistory = [
                ...gameHistory(),
                {
                  fen: game().fen(),
                  move: move.san,
                  capturedPiece: move.captured ? { type: move.captured, color: (playerColor() === "w" ? "b" : "w") as "w" | "b" } : undefined,
                  lastMove: { from, to: square },
                },
              ];

              setGameHistory(newHistory);
              setCurrentMoveIndex(newHistory.length - 1);
              setLastMove({ from, to: square });
              setGame(new Chess(game().fen()));

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
        const move = game().move(bestMoveSan);
        if (move) {
          const from = move.from as Square;
          const to = move.to as Square;
          const piece = game().get(to); // Get piece after move

          const performAiMove = () => {
            // Update piece registry
            const registry = pieceRegistry();
            handlePieceMove(registry, from, to, move.captured ? { type: move.captured, color: playerColor() === "w" ? "w" : "b" } : undefined);

            // Handle special moves - detect castling by king moving more than 1 square
            if (piece && piece.type === "k" && Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) > 1) {
              handleCastling(registry, { from, to });
            }

            setPieceRegistry({ ...registry });

            const newHistory = [
              ...gameHistory(),
              {
                fen: game().fen(),
                move: move.san,
                capturedPiece: move.captured ? { type: move.captured, color: (playerColor() === "w" ? "w" : "b") as "w" | "b" } : undefined,
                lastMove: { from, to },
              },
            ];

            setGameHistory(newHistory);
            setCurrentMoveIndex(newHistory.length - 1);
            setLastMove({ from, to });
            setGame(new Chess(game().fen()));
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
      setCurrentMoveIndex(newIndex);
      setLastMove(historyEntry.lastMove);
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  return (
    <div class="flex h-full items-center justify-center">
      <div class="flex w-full items-start gap-6">
        {/* White captured pieces (left) */}
        {gameStarted() && (
          <div class="fixed bottom-1/2 left-0 max-w-[200px] flex-1">
            <div class="bg-card/50 border-border sticky top-4 rounded-lg border p-4 backdrop-blur">
              <div class="mb-3 text-sm font-semibold text-white">White Captured</div>
              <div class="flex min-h-[60px] flex-wrap gap-2">
                {capturedPieces().white.map((piece) => (
                  <div class="animate-scale-in" style={{ width: "calc(min(70vmin, 600px) / 32)", height: "calc(min(70vmin, 600px) / 32)" }}>
                    <ChessPiece piece={() => piece} />
                  </div>
                ))}
              </div>
              <div class="text-muted-neutral-800 mt-2 text-xs font-semibold">Points: {whitePoints()}</div>
            </div>
          </div>
        )}

        {/* Center: Board and controls */}
        <div class="flex flex-col items-center gap-4">
          {/* Color selection - shown before game() starts */}
          {!gameStarted() && (
            <div class="fixed z-10 mb-4 flex flex-col items-center">
              <h2 class="text-2xl font-bold text-white">Choose Your Color</h2>
              <div class="flex gap-4">
                <button onClick={() => setPlayerColor("w")} class="min-w-[140px]">
                  Play as White
                </button>
                <button onClick={() => setPlayerColor("b")} class="min-w-[140px]">
                  Play as Black
                </button>
              </div>
              <button onClick={startGame} class="mt-2 min-w-[200px]">
                Start Game
              </button>
            </div>
          )}

          {/* Status */}
          {gameStarted() && isViewingHistory() && (
            <div class="rounded-lg border border-yellow-500/50 bg-yellow-500/20 px-4 py-2 text-sm font-semibold">
              Viewing history - Move {currentMoveIndex()} of {gameHistory().length - 1}
            </div>
          )}

          <ChessBoard
            boardState={() => (sq) => game().get(sq) ?? null}
            player={playerColor}
            pieceRegistry={pieceRegistry}
            onSquareClick={handleSquareClick}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            lastMove={lastMove}
          />

          {/* Point difference */}
          {gameStarted() && pointDifference() !== 0 && (
            <div class="animate-fade-in fixed top-1/12 text-lg font-semibold">
              {pointDifference() > 0 ? `White +${pointDifference()}` : `Black +${Math.abs(pointDifference())}`}
            </div>
          )}

          {/* Move list */}
          {gameStarted() && (
            <div class="bg-card border-border fixed bottom-0 max-h-[150px] w-full max-w-[600px] overflow-y-auto rounded-lg border p-4">
              <div class="mb-2 text-sm font-semibold text-white">Move History</div>
              <div class="flex flex-wrap gap-x-4 gap-y-1">
                {gameHistory()
                  .slice(1)
                  .map((entry, idx) => (
                    <span class={`font-mono text-sm ${idx === currentMoveIndex() - 1 ? "font-bold text-neutral-100" : "text-muted-neutral-800"}`}>
                      {Math.floor(idx / 2) + 1}.{idx % 2 === 0 ? "" : ".."} {entry.move}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Game controls */}
          {gameStarted() && (
            <div class="fixed top-0 flex items-center gap-3">
              <button onClick={goToPreviousMove} disabled={currentMoveIndex() === 0}>
                {"<"}
              </button>

              <button onClick={resetGame} class="gap-2">
                Reset Game
              </button>

              <button onClick={goToNextMove} disabled={currentMoveIndex() === gameHistory().length - 1}>
                {">"}
              </button>

              {isAiThinking() && <span class="ml-2 animate-pulse text-sm">AI is thinking...</span>}
            </div>
          )}
        </div>

        {/* Black captured pieces (right) */}
        {gameStarted() && (
          <div class="fixed right-0 bottom-1/2 max-w-[200px] flex-1">
            <div class="bg-card/50 border-border sticky top-4 rounded-lg border p-4 backdrop-blur">
              <div class="mb-3 text-sm font-semibold text-white">Black Captured</div>
              <div class="flex min-h-[60px] flex-wrap gap-2">
                {capturedPieces().black.map((piece) => (
                  <div class="animate-scale-in" style={{ width: "calc(min(70vmin, 600px) / 32)", height: "calc(min(70vmin, 600px) / 32)" }}>
                    <ChessPiece piece={() => piece} />
                  </div>
                ))}
              </div>
              <div class="text-muted-neutral-800 mt-2 text-xs font-semibold">Points: {blackPoints()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
