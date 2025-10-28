import { useState } from "react";
import { Chess, Square, PieceSymbol } from "chess.js";
import { findBestMove } from "@/lib/chess-ai";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChessPiece } from "./ChessPiece";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface GameHistoryEntry {
  fen: string;
  move: string;
  capturedPiece?: { type: PieceSymbol; color: "w" | "b" };
  lastMove: { from: Square; to: Square } | null;
}

interface ChessBoardProps {}

export const ChessBoard = ({}: ChessBoardProps) => {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([
    { fen: new Chess().fen(), move: "Start", capturedPiece: undefined, lastMove: null }
  ]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [animatingMove, setAnimatingMove] = useState<{ from: Square; to: Square; piece: { type: PieceSymbol; color: "w" | "b" } } | null>(null);

  const isViewingHistory = currentMoveIndex < gameHistory.length - 1;

  const getGameStatus = () => {
    if (game.isCheckmate()) {
      return game.turn() === "w" ? "Checkmate! Black wins!" : "Checkmate! White wins!";
    }
    if (game.isStalemate()) return "Stalemate! Draw!";
    if (game.isThreefoldRepetition()) return "Draw by threefold repetition!";
    if (game.isInsufficientMaterial()) return "Draw by insufficient material!";
    if (game.isDraw()) return "Draw!";
    if (game.isCheck()) return `Check! ${game.turn() === "w" ? "White" : "Black"} to move`;
    return `${game.turn() === "w" ? "White" : "Black"} to move`;
  };

  const getCapturedPieces = () => {
    const startingPieces = {
      p: 8, n: 2, b: 2, r: 2, q: 1, k: 1
    };
    
    const currentPieces = { w: { ...startingPieces }, b: { ...startingPieces } };
    
    // Count current pieces on board
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = `${String.fromCharCode(97 + j)}${8 - i}` as Square;
        const piece = game.get(square);
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
      if (type !== 'k') {
        for (let i = 0; i < count; i++) {
          whiteCaptured.push({ type: type as PieceSymbol, color: "b" });
        }
      }
    });
    
    // Black captured white pieces
    Object.entries(currentPieces.w).forEach(([type, count]) => {
      if (type !== 'k') {
        for (let i = 0; i < count; i++) {
          blackCaptured.push({ type: type as PieceSymbol, color: "w" });
        }
      }
    });
    
    return { white: whiteCaptured, black: blackCaptured };
  };

  const calculatePoints = (pieces: { type: PieceSymbol; color: "w" | "b" }[]) => {
    const pieceValues: { [key in PieceSymbol]: number } = {
      p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
    };
    return pieces.reduce((sum, piece) => sum + (pieceValues[piece.type] || 0), 0);
  };

  const capturedPieces = getCapturedPieces();
  const whitePoints = calculatePoints(capturedPieces.white);
  const blackPoints = calculatePoints(capturedPieces.black);
  const pointDifference = whitePoints - blackPoints;

  const startGame = () => {
    setGameStarted(true);
    if (playerColor === 'b') {
      // AI makes first move
      setTimeout(() => makeAiMove(), 500);
    }
  };

  const handleSquareClick = (square: Square) => {
    if (isAiThinking || isViewingHistory || !gameStarted) return;
    
    const expectedColor = playerColor;
    if (game.turn() !== expectedColor) return;

    if (selectedSquare) {
      if (validMoves.includes(square)) {
        try {
          const piece = game.get(selectedSquare);
          if (!piece) return;

          const move = game.move({
            from: selectedSquare,
            to: square,
            promotion: "q"
          });

          if (move) {
            // Trigger animation
            setAnimatingMove({ from: selectedSquare, to: square, piece });
            
            setTimeout(() => {
              const newHistory = [...gameHistory, {
                fen: game.fen(),
                move: move.san,
                capturedPiece: move.captured ? { type: move.captured, color: (playerColor === 'w' ? "b" : "w") as "w" | "b" } : undefined,
                lastMove: { from: selectedSquare, to: square }
              }];
              
              setGameHistory(newHistory);
              setCurrentMoveIndex(newHistory.length - 1);
              setLastMove({ from: selectedSquare, to: square });
              setGame(new Chess(game.fen()));
              setAnimatingMove(null);
              toast.success(`Move: ${move.san}`);
              
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
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setValidMoves(moves.map((m) => m.to as Square));
      }
    }
  };

  const makeAiMove = () => {
    setIsAiThinking(true);
    
    setTimeout(() => {
      const bestMove = findBestMove(game, 3);
      if (bestMove) {
        const move = game.move(bestMove);
        if (move) {
          const fromSquare = move.from as Square;
          const toSquare = move.to as Square;
          const piece = { type: move.piece as PieceSymbol, color: move.color };
          
          setAnimatingMove({ from: fromSquare, to: toSquare, piece });

          setTimeout(() => {
            const newHistory = [...gameHistory, {
              fen: game.fen(),
              move: move.san,
              capturedPiece: move.captured ? { type: move.captured, color: (playerColor === 'w' ? "w" : "b") as "w" | "b" } : undefined,
              lastMove: { from: move.from as Square, to: move.to as Square }
            }];
            
            setGameHistory(newHistory);
            setCurrentMoveIndex(newHistory.length - 1);
            setLastMove({ from: move.from as Square, to: move.to as Square });
            setGame(new Chess(game.fen()));
            setAnimatingMove(null);
            toast.info(`AI plays: ${move.san}`);
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
    setGameHistory([
      { fen: newGame.fen(), move: "Start", capturedPiece: undefined, lastMove: null }
    ]);
    setCurrentMoveIndex(0);
    setGameStarted(false);
    setAnimatingMove(null);
    toast.success("Game reset!");
  };

  const goToPreviousMove = () => {
    if (currentMoveIndex > 0) {
      const newIndex = currentMoveIndex - 1;
      const historyEntry = gameHistory[newIndex];
      const newGame = new Chess(historyEntry.fen);
      setGame(newGame);
      setCurrentMoveIndex(newIndex);
      setLastMove(historyEntry.lastMove);
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const goToNextMove = () => {
    if (currentMoveIndex < gameHistory.length - 1) {
      const newIndex = currentMoveIndex + 1;
      const historyEntry = gameHistory[newIndex];
      const newGame = new Chess(historyEntry.fen);
      setGame(newGame);
      setCurrentMoveIndex(newIndex);
      setLastMove(historyEntry.lastMove);
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const getSquareCoordinates = (row: number, col: number): Square => {
    if (playerColor === 'w') {
      return `${String.fromCharCode(97 + col)}${8 - row}` as Square;
    } else {
      return `${String.fromCharCode(104 - col)}${row + 1}` as Square;
    }
  };

  const getSquarePosition = (square: Square): { row: number; col: number } => {
    const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = parseInt(square[1]) - 1; // 1=0, 2=1, etc.
    
    if (playerColor === 'w') {
      return { row: 8 - rank - 1, col: file };
    } else {
      return { row: rank, col: 7 - file };
    }
  };

  const renderSquare = (row: number, col: number) => {
    const square = getSquareCoordinates(row, col);
    const piece = game.get(square);
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedSquare === square;
    const isValidMove = validMoves.includes(square);
    const isLastMoveSquare = lastMove && (lastMove.from === square || lastMove.to === square);
    const isKingInCheck = piece?.type === "k" && piece.color === game.turn() && game.isCheck();
    const isCapture = isValidMove && piece;
    const isAnimatingFrom = animatingMove?.from === square;
    const isAnimatingTo = animatingMove?.to === square;

    let squareClass = "aspect-square flex items-center justify-center text-5xl cursor-pointer select-none transition-all relative";
    
    if (isLight) {
      squareClass += " bg-[hsl(var(--square-light))]";
    } else {
      squareClass += " bg-[hsl(var(--square-dark))]";
    }

    if (isSelected) {
      squareClass += " ring-4 ring-primary ring-inset";
    }

    if (isLastMoveSquare) {
      squareClass += " bg-[hsl(var(--square-last-move))]";
    }

    if (isKingInCheck) {
      squareClass += " bg-[hsl(var(--square-check))] animate-pulse";
    }

    return (
      <div
        key={square}
        className={squareClass}
        onClick={() => handleSquareClick(square)}
      >
        {piece && !isAnimatingFrom && (
          <ChessPiece 
            type={piece.type} 
            color={piece.color} 
            className="z-10"
          />
        )}
        {isValidMove && !piece && (
          <div className="absolute w-3 h-3 bg-primary rounded-full opacity-50" />
        )}
        {isCapture && (
          <div className="absolute inset-2 border-4 border-primary rounded-full opacity-50" />
        )}
      </div>
    );
  };

  const files = playerColor === 'w' 
    ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
  
  const ranks = playerColor === 'w'
    ? [8, 7, 6, 5, 4, 3, 2, 1]
    : [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[radial-gradient(circle_at_center,hsl(var(--bg-gradient-start)),hsl(var(--bg-gradient-end)))]">
      <div className="flex gap-6 items-start w-full max-w-6xl">
        {/* White captured pieces (left) */}
        {gameStarted && <div className="flex-1 max-w-[200px]">
          <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4 sticky top-4">
            <div className="text-sm font-semibold mb-3 text-foreground">White Captured</div>
            <div className="flex flex-wrap gap-2 min-h-[60px]">
              {capturedPieces.white.map((piece, idx) => (
                <div key={idx} className="animate-scale-in" style={{ width: 'calc(min(70vmin, 600px) / 32)', height: 'calc(min(70vmin, 600px) / 32)' }}>
                  <ChessPiece type={piece.type} color={piece.color} />
                </div>
              ))}
            </div>
            <div className="text-xs mt-2 font-semibold text-muted-foreground">
              Points: {whitePoints}
            </div>
          </div>
        </div>}

        {/* Center: Board and controls */}
        <div className="flex flex-col items-center gap-4">
          {/* Color selection - shown before game starts */}
          {!gameStarted && (
            <div className="flex flex-col items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold text-foreground">Choose Your Color</h2>
              <div className="flex gap-4">
                <Button
                  onClick={() => setPlayerColor('w')}
                  variant={playerColor === 'w' ? 'default' : 'outline'}
                  size="lg"
                  className="min-w-[140px]"
                >
                  Play as White
                </Button>
                <Button
                  onClick={() => setPlayerColor('b')}
                  variant={playerColor === 'b' ? 'default' : 'outline'}
                  size="lg"
                  className="min-w-[140px]"
                >
                  Play as Black
                </Button>
              </div>
              <Button
                onClick={startGame}
                size="lg"
                className="mt-2 min-w-[200px]"
              >
                Start Game
              </Button>
            </div>
          )}

          {/* Status */}
          {gameStarted && isViewingHistory && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 text-sm font-semibold">
              Viewing history - Move {currentMoveIndex} of {gameHistory.length - 1}
            </div>
          )}

          {/* Board with notation */}
          <div className="flex flex-col items-center">
            {/* Top file letters */}
            <div className="flex mb-1">
              <div className="w-6" />
              {files.map((file) => (
                <div key={file} className="flex items-center justify-center text-sm font-semibold text-foreground/70" style={{ width: 'calc(min(70vmin, 600px) / 8)' }}>
                  {file}
                </div>
              ))}
              <div className="w-6" />
            </div>

            {/* Board with rank numbers */}
            <div className="flex">
              {/* Left rank numbers */}
              <div className="flex flex-col justify-around pr-1">
                {ranks.map((rank) => (
                  <div key={`left-${rank}`} className="flex items-center justify-center text-sm font-semibold text-foreground/70" style={{ height: 'calc(min(70vmin, 600px) / 8)' }}>
                    {rank}
                  </div>
                ))}
              </div>

              {/* Chess board */}
              <div className="grid grid-cols-8 gap-0 shadow-2xl w-[min(70vmin,600px)] relative">
                {Array.from({ length: 8 }).map((_, row) =>
                  Array.from({ length: 8 }).map((_, col) => renderSquare(row, col))
                )}
                
                {/* Animating piece overlay */}
                {animatingMove && (
                  <div 
                    className="absolute pointer-events-none z-50 transition-transform duration-300 ease-out"
                    style={{
                      width: 'calc(100% / 8)',
                      height: 'calc(100% / 8)',
                      left: `${getSquarePosition(animatingMove.from).col * 12.5}%`,
                      top: `${getSquarePosition(animatingMove.from).row * 12.5}%`,
                      transform: `translate(${(getSquarePosition(animatingMove.to).col - getSquarePosition(animatingMove.from).col) * 100}%, ${(getSquarePosition(animatingMove.to).row - getSquarePosition(animatingMove.from).row) * 100}%)`
                    }}
                  >
                    <ChessPiece 
                      type={animatingMove.piece.type} 
                      color={animatingMove.piece.color}
                      className="w-full h-full"
                    />
                  </div>
                )}
              </div>

              {/* Right rank numbers */}
              <div className="flex flex-col justify-around pl-1">
                {ranks.map((rank) => (
                  <div key={`right-${rank}`} className="flex items-center justify-center text-sm font-semibold text-foreground/70" style={{ height: 'calc(min(70vmin, 600px) / 8)' }}>
                    {rank}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom file letters */}
            <div className="flex mt-1">
              <div className="w-6" />
              {files.map((file) => (
                <div key={file} className="flex items-center justify-center text-sm font-semibold text-foreground/70" style={{ width: 'calc(min(70vmin, 600px) / 8)' }}>
                  {file}
                </div>
              ))}
              <div className="w-6" />
            </div>
          </div>

          {/* Point difference */}
          {gameStarted && pointDifference !== 0 && (
            <div className="text-lg font-semibold animate-fade-in">
              {pointDifference > 0 
                ? `White +${pointDifference}` 
                : `Black +${Math.abs(pointDifference)}`}
            </div>
          )}

          {/* Move list */}
          {gameStarted && <div className="w-full max-w-[600px] bg-card border border-border rounded-lg p-4 max-h-[150px] overflow-y-auto">
            <div className="text-sm font-semibold mb-2 text-foreground">Move History</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {gameHistory.slice(1).map((entry, idx) => (
                <span 
                  key={idx} 
                  className={`text-sm font-mono ${idx === currentMoveIndex - 1 ? 'font-bold text-primary' : 'text-muted-foreground'}`}
                >
                  {Math.floor(idx / 2) + 1}.{idx % 2 === 0 ? "" : ".."} {entry.move}
                </span>
              ))}
            </div>
          </div>}

          {/* Game controls */}
          {gameStarted && <div className="flex gap-3 items-center">
            <Button 
              onClick={goToPreviousMove} 
              disabled={currentMoveIndex === 0}
              variant="outline"
              size="icon"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={resetGame} 
              variant="default"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Game
            </Button>

            <Button 
              onClick={goToNextMove} 
              disabled={currentMoveIndex === gameHistory.length - 1}
              variant="outline"
              size="icon"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {isAiThinking && (
              <span className="text-sm animate-pulse ml-2">AI is thinking...</span>
            )}
          </div>}
        </div>

        {/* Black captured pieces (right) */}
        {gameStarted && <div className="flex-1 max-w-[200px]">
          <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4 sticky top-4">
            <div className="text-sm font-semibold mb-3 text-foreground">Black Captured</div>
            <div className="flex flex-wrap gap-2 min-h-[60px]">
              {capturedPieces.black.map((piece, idx) => (
                <div key={idx} className="animate-scale-in" style={{ width: 'calc(min(70vmin, 600px) / 32)', height: 'calc(min(70vmin, 600px) / 32)' }}>
                  <ChessPiece type={piece.type} color={piece.color} />
                </div>
              ))}
            </div>
            <div className="text-xs mt-2 font-semibold text-muted-foreground">
              Points: {blackPoints}
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
};
