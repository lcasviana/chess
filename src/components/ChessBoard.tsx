import { Chess, PieceSymbol, Square } from "chess.js";
import { createSignal } from "solid-js";

import { findBestMove } from "~/lib/chess-ai";

import { ChessPiece } from "./ChessPiece";

interface GameHistoryEntry {
  fen: string;
  move: string;
  capturedPiece?: { type: PieceSymbol; color: "w" | "b" };
  lastMove: { from: Square; to: Square } | null;
}

interface ChessBoardProps {}

export const ChessBoard = ({}: ChessBoardProps) => {
  const [game, setGame] = createSignal(new Chess());
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

  const getGameStatus = () => {
    if (game().isCheckmate()) {
      return game().turn() === "w" ? "Checkmate! Black wins!" : "Checkmate! White wins!";
    }
    if (game().isStalemate()) return "Stalemate! Draw!";
    if (game().isThreefoldRepetition()) return "Draw by threefold repetition!";
    if (game().isInsufficientMaterial()) return "Draw by insufficient material!";
    if (game().isDraw()) return "Draw!";
    if (game().isCheck()) return `Check! ${game().turn() === "w" ? "White" : "Black"} to move`;
    return `${game().turn() === "w" ? "White" : "Black"} to move`;
  };

  const getCapturedPieces = () => {
    const startingPieces = {
      p: 8,
      n: 2,
      b: 2,
      r: 2,
      q: 1,
      k: 1,
    };

    const currentPieces = { w: { ...startingPieces }, b: { ...startingPieces } };

    // Count current pieces on board
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = `${String.fromCharCode(97 + j)}${8 - i}` as Square;
        const piece = game().get(square);
        if (piece) {
          currentPieces[piece.color][piece.type]--;
        }
      }
    }

    // Build captured pieces arrays with SVG data
    const whiteCaptured: { type: PieceSymbol; color: "w" | "b" }[] = [];
    const blackCaptured: { type: PieceSymbol; color: "w" | "b" }[] = [];

    // White captured black pieces
    Object.entries(currentPieces.b).forEach(([type, count]) => {
      if (type !== "k") {
        for (let i = 0; i < count; i++) {
          whiteCaptured.push({ type: type as PieceSymbol, color: "b" });
        }
      }
    });

    // Black captured white pieces
    Object.entries(currentPieces.w).forEach(([type, count]) => {
      if (type !== "k") {
        for (let i = 0; i < count; i++) {
          blackCaptured.push({ type: type as PieceSymbol, color: "w" });
        }
      }
    });

    return { white: whiteCaptured, black: blackCaptured };
  };

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

  const capturedPieces = getCapturedPieces();
  const whitePoints = calculatePoints(capturedPieces.white);
  const blackPoints = calculatePoints(capturedPieces.black);
  const pointDifference = whitePoints - blackPoints;

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

    if (selectedSquare()) {
      if (validMoves().includes(square)) {
        try {
          const piece = game().get(selectedSquare()!);
          if (!piece) return;

          const move = game().move({
            from: selectedSquare()!,
            to: square,
            promotion: "q",
          });

          if (move) {
            setTimeout(() => {
              const newHistory = [
                ...gameHistory(),
                {
                  fen: game().fen(),
                  move: move.san,
                  capturedPiece: move.captured ? { type: move.captured, color: (playerColor() === "w" ? "b" : "w") as "w" | "b" } : undefined,
                  lastMove: { from: selectedSquare()!, to: square },
                },
              ];

              setGameHistory(newHistory);
              setCurrentMoveIndex(newHistory.length - 1);
              setLastMove({ from: selectedSquare()!, to: square });
              setGame(new Chess(game().fen()));

              setTimeout(() => makeAiMove(), 500);
            }, 300);
          }
        } catch (e) {
          // Invalid move
        }
      }
      setSelectedSquare(null);
      setValidMoves([]);
    } else {
      const piece = game().get(square);
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
      const bestMove = findBestMove(game(), 3);
      if (bestMove) {
        const move = game().move(bestMove);
        if (move) {
          const fromSquare = move.from as Square;
          const toSquare = move.to as Square;
          const piece = { type: move.piece as PieceSymbol, color: move.color };

          setTimeout(() => {
            const newHistory = [
              ...gameHistory(),
              {
                fen: game().fen(),
                move: move.san,
                capturedPiece: move.captured ? { type: move.captured, color: (playerColor() === "w" ? "w" : "b") as "w" | "b" } : undefined,
                lastMove: { from: move.from as Square, to: move.to as Square },
              },
            ];

            setGameHistory(newHistory);
            setCurrentMoveIndex(newHistory.length - 1);
            setLastMove({ from: move.from as Square, to: move.to as Square });
            setGame(new Chess(game().fen()));
            setIsAiThinking(false);
          }, 300);
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
    if (currentMoveIndex() < gameHistory.length - 1) {
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

  const getSquareCoordinates = (row: number, col: number): Square => {
    if (playerColor() === "w") {
      return `${String.fromCharCode(97 + col)}${8 - row}` as Square;
    } else {
      return `${String.fromCharCode(104 - col)}${row + 1}` as Square;
    }
  };

  const getSquarePosition = (square: Square): { row: number; col: number } => {
    const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = parseInt(square[1]) - 1; // 1=0, 2=1, etc.

    if (playerColor() === "w") {
      return { row: 8 - rank - 1, col: file };
    } else {
      return { row: rank, col: 7 - file };
    }
  };

  const renderSquare = (row: number, col: number) => {
    const square = getSquareCoordinates(row, col);
    const piece = game().get(square);
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedSquare() === square;
    const isValidMove = validMoves().includes(square);
    const isLastMoveSquare = lastMove() && (lastMove()?.from === square || lastMove()?.to === square);
    const isKingInCheck = piece?.type === "k" && piece.color === game().turn() && game().isCheck();
    const isCapture = isValidMove && piece;

    let squareClass = "aspect-square flex items-center justify-center text-5xl cursor-pointer select-none transition-all relative";

    if (isLight) {
      squareClass += " bg-neutral-300";
    } else {
      squareClass += " bg-neutral-500";
    }

    if (isSelected) {
      squareClass += " ring-4 ring-primary ring-inset";
    }

    if (isLastMoveSquare) {
      squareClass += " bg-yellow-200";
    }

    if (isKingInCheck) {
      squareClass += " bg-red-900 animate-pulse";
    }

    return (
      <div class={squareClass} onClick={() => handleSquareClick(square)}>
        {piece && <ChessPiece piece={piece} />}
        {isValidMove && !piece && <div class="bg-primary absolute h-3 w-3 rounded-full opacity-50" />}
        {isCapture && <div class="border-primary absolute inset-2 rounded-full border-4 opacity-50" />}
      </div>
    );
  };

  const files = playerColor() === "w" ? ["a", "b", "c", "d", "e", "f", "g", "h"] : ["h", "g", "f", "e", "d", "c", "b", "a"];

  const ranks = playerColor() === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div class="flex h-full items-center justify-center p-4">
      <div class="flex w-full max-w-6xl items-start gap-6">
        {/* White captured pieces (left) */}
        {gameStarted() && (
          <div class="max-w-[200px] flex-1">
            <div class="bg-card/50 border-border sticky top-4 rounded-lg border p-4 backdrop-blur">
              <div class="text-foreground mb-3 text-sm font-semibold">White Captured</div>
              <div class="flex min-h-[60px] flex-wrap gap-2">
                {capturedPieces.white.map((piece, idx) => (
                  <div class="animate-scale-in" style={{ width: "calc(min(70vmin, 600px) / 32)", height: "calc(min(70vmin, 600px) / 32)" }}>
                    <ChessPiece piece={piece} />
                  </div>
                ))}
              </div>
              <div class="text-muted-foreground mt-2 text-xs font-semibold">Points: {whitePoints}</div>
            </div>
          </div>
        )}

        {/* Center: Board and controls */}
        <div class="flex flex-col items-center gap-4">
          {/* Color selection - shown before game() starts */}
          {!gameStarted() && (
            <div class="mb-4 flex flex-col items-center gap-4">
              <h2 class="text-foreground text-2xl font-bold">Choose Your Color</h2>
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
              Viewing history - Move {currentMoveIndex()} of {gameHistory.length - 1}
            </div>
          )}

          {/* Board with notation */}
          <div class="flex flex-col items-center">
            {/* Top file letters */}
            <div class="mb-1 flex">
              <div class="w-6" />
              {files.map((file) => (
                <div
                  class="text-foreground/70 flex items-center justify-center text-sm font-semibold"
                  style={{ width: "calc(min(70vmin, 600px) / 8)" }}
                >
                  {file}
                </div>
              ))}
              <div class="w-6" />
            </div>

            {/* Board with rank numbers */}
            <div class="flex">
              {/* Left rank numbers */}
              <div class="flex flex-col justify-around pr-1">
                {ranks.map((rank) => (
                  <div
                    class="text-foreground/70 flex items-center justify-center text-sm font-semibold"
                    style={{ height: "calc(min(70vmin, 600px) / 8)" }}
                  >
                    {rank}
                  </div>
                ))}
              </div>

              {/* Chess board */}
              <div class="relative grid w-[min(70vmin,600px)] grid-cols-8 gap-0 bg-red-500 shadow-2xl">
                {Array.from({ length: 8 }).map((_, row) => Array.from({ length: 8 }).map((_, col) => renderSquare(row, col)))}
              </div>

              {/* Right rank numbers */}
              <div class="flex flex-col justify-around pl-1">
                {ranks.map((rank) => (
                  <div
                    class="text-foreground/70 flex items-center justify-center text-sm font-semibold"
                    style={{ height: "calc(min(70vmin, 600px) / 8)" }}
                  >
                    {rank}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom file letters */}
            <div class="mt-1 flex">
              <div class="w-6" />
              {files.map((file) => (
                <div
                  class="text-foreground/70 flex items-center justify-center text-sm font-semibold"
                  style={{ width: "calc(min(70vmin, 600px) / 8)" }}
                >
                  {file}
                </div>
              ))}
              <div class="w-6" />
            </div>
          </div>

          {/* Point difference */}
          {gameStarted() && pointDifference !== 0 && (
            <div class="animate-fade-in text-lg font-semibold">
              {pointDifference > 0 ? `White +${pointDifference}` : `Black +${Math.abs(pointDifference)}`}
            </div>
          )}

          {/* Move list */}
          {gameStarted() && (
            <div class="bg-card border-border max-h-[150px] w-full max-w-[600px] overflow-y-auto rounded-lg border p-4">
              <div class="text-foreground mb-2 text-sm font-semibold">Move History</div>
              <div class="flex flex-wrap gap-x-4 gap-y-1">
                {gameHistory()
                  .slice(1)
                  .map((entry, idx) => (
                    <span class={`font-mono text-sm ${idx === currentMoveIndex() - 1 ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {Math.floor(idx / 2) + 1}.{idx % 2 === 0 ? "" : ".."} {entry.move}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Game controls */}
          {gameStarted() && (
            <div class="flex items-center gap-3">
              <button onClick={goToPreviousMove} disabled={currentMoveIndex() === 0}>
                {"<"}
              </button>

              <button onClick={resetGame} class="gap-2">
                Reset Game
              </button>

              <button onClick={goToNextMove} disabled={currentMoveIndex() === gameHistory.length - 1}>
                {">"}
              </button>

              {isAiThinking() && <span class="ml-2 animate-pulse text-sm">AI is thinking...</span>}
            </div>
          )}
        </div>

        {/* Black captured pieces (right) */}
        {gameStarted() && (
          <div class="max-w-[200px] flex-1">
            <div class="bg-card/50 border-border sticky top-4 rounded-lg border p-4 backdrop-blur">
              <div class="text-foreground mb-3 text-sm font-semibold">Black Captured</div>
              <div class="flex min-h-[60px] flex-wrap gap-2">
                {capturedPieces.black.map((piece, idx) => (
                  <div class="animate-scale-in" style={{ width: "calc(min(70vmin, 600px) / 32)", height: "calc(min(70vmin, 600px) / 32)" }}>
                    <ChessPiece piece={piece} />
                  </div>
                ))}
              </div>
              <div class="text-muted-foreground mt-2 text-xs font-semibold">Points: {blackPoints}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
