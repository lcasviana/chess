import type { Color, Square } from "chess.js";
import { Chess } from "chess.js";
import type { Accessor } from "solid-js";
import { batch, createSignal } from "solid-js";

import { files } from "~/components/ChessCoordinates";
import type { ChessPieceType } from "~/components/ChessPiece";
import type { ChessSquareColor } from "~/components/ChessSquare";
import { createChessBot } from "~/services/chess-bot";

let storeInstance: ChessStore | null = null;

function initializeBoardFromChess(chess: Chess, generateId: () => string, idMap: Map<Square, string>): Record<Square, ChessPieceType | null> {
  const boardState: Record<string, ChessPieceType | null> = {};
  const chessBoard = chess.board();

  chessBoard.forEach((row, rankIndex) => {
    row.forEach((piece, fileIndex) => {
      const square = `${files[fileIndex]}${8 - rankIndex}` as Square;
      if (piece) {
        const id = generateId();
        idMap.set(square, id);
        boardState[square] = { ...piece, id };
      } else {
        boardState[square] = null;
      }
    });
  });

  return boardState as Record<Square, ChessPieceType | null>;
}

function createChessStore(): ChessStore {
  const chess = new Chess();

  // Piece ID management for view transitions
  let pieceIdCounter = 1;
  const pieceIdMap = new Map<Square, string>(); // Tracks which piece ID is on which square

  const generatePieceId = (): string => {
    return `p${pieceIdCounter++}`;
  };

  const [gameStarted, setGameStarted] = createSignal<boolean>(false);
  const [player, setPlayer] = createSignal<Color>("w");
  const [capturedPieces, setCapturedPieces] = createSignal<ChessPieceType[]>([]);
  const [selectedSquare, setSelectedSquare] = createSignal<Square | null>(null);
  const [lastMove, setLastMove] = createSignal<{ from: Square; to: Square } | null>(null);
  const [validMoves, setValidMoves] = createSignal<Square[]>([]);
  const [board, setBoard] = createSignal<Record<Square, ChessPieceType | null>>(initializeBoardFromChess(chess, generatePieceId, pieceIdMap));
  const [turn, setTurn] = createSignal<Color>(chess.turn());
  const [isCheck, setIsCheck] = createSignal<boolean>(chess.isCheck());
  const [isCheckmate, setIsCheckmate] = createSignal<boolean>(chess.isCheckmate());
  const [isGameOver, setIsGameOver] = createSignal<boolean>(chess.isGameOver());
  const [isDraw, setIsDraw] = createSignal<boolean>(chess.isDraw());
  const [isStalemate, setIsStalemate] = createSignal<boolean>(chess.isStalemate());
  const [isThreefoldRepetition, setIsThreefoldRepetition] = createSignal<boolean>(chess.isThreefoldRepetition());
  const [isInsufficientMaterial, setIsInsufficientMaterial] = createSignal<boolean>(chess.isInsufficientMaterial());

  const syncBoardToStore = () => {
    const chessBoard = chess.board();

    const _board = {} as Record<Square, ChessPieceType | null>;
    const currentSquares = new Set<Square>();

    chessBoard.forEach((row, rankIndex) => {
      row.forEach((piece, fileIndex) => {
        const square = `${files[fileIndex]}${8 - rankIndex}` as Square;
        currentSquares.add(square);
        if (piece) {
          // Preserve existing ID from the map, or generate new one for promotions
          const id = pieceIdMap.get(square) || generatePieceId();
          if (!pieceIdMap.has(square)) {
            pieceIdMap.set(square, id);
          }
          _board[square] = { ...piece, id };
        } else {
          _board[square] = null;
        }
      });
    });

    // Clean up IDs for squares that no longer have pieces
    for (const [square] of pieceIdMap) {
      if (!currentSquares.has(square) || _board[square] === null) {
        pieceIdMap.delete(square);
      }
    }

    setBoard(_board);
  };

  const syncGameState = () => {
    setTurn(chess.turn());
    setIsCheck(chess.isCheck());
    setIsCheckmate(chess.isCheckmate());
    setIsGameOver(chess.isGameOver());
    setIsDraw(chess.isDraw());
    setIsStalemate(chess.isStalemate());
    setIsThreefoldRepetition(chess.isThreefoldRepetition());
    setIsInsufficientMaterial(chess.isInsufficientMaterial());

    // Trigger bot move if it's the bot's turn
    if (!chess.isGameOver() && chess.turn() !== player()) {
      setTimeout(() => makeComputerMove(), 500);
    }
  };

  const makeComputerMove = () => {
    if (chess.isGameOver() || chess.turn() === player()) return;

    try {
      const bot = createChessBot(chess);
      const move = bot.getBestMove();

      if (move) {
        // Get the ID of the piece being moved and captured (if any)
        const movingPieceId = pieceIdMap.get(move.from as Square);
        const capturedPieceId = pieceIdMap.get(move.to as Square);

        const result = chess.move(move);

        if (result) {
          const performUpdate = () => {
            batch(() => {
              // Update piece ID mappings: move piece from source to destination
              if (movingPieceId) {
                pieceIdMap.delete(move.from as Square);
                pieceIdMap.set(move.to as Square, movingPieceId);
              }

              syncBoardToStore();
              // Update game state without triggering another bot move
              setTurn(chess.turn());
              setIsCheck(chess.isCheck());
              setIsCheckmate(chess.isCheckmate());
              setIsGameOver(chess.isGameOver());
              setIsDraw(chess.isDraw());
              setIsStalemate(chess.isStalemate());
              setIsThreefoldRepetition(chess.isThreefoldRepetition());
              setIsInsufficientMaterial(chess.isInsufficientMaterial());
              setLastMove({ from: move.from, to: move.to });
              if (result.captured && capturedPieceId) {
                setCapturedPieces([...capturedPieces(), { id: capturedPieceId, color: result.color === "w" ? "b" : "w", type: result.captured }]);
              }
            });
          };

          // Wrap entire update in view transition for smooth animations
          if (document.startViewTransition) {
            document.startViewTransition(performUpdate);
          } else {
            performUpdate();
          }
        }
      }
    } catch (error) {
      console.error("[Bot] Error making move:", error);
    }
  };

  const flip = () => player() === "b";

  const onGameStart = () => {
    setGameStarted(true);
    // If player chose black, bot (white) makes the first move
    if (player() === "b") {
      setTimeout(() => makeComputerMove(), 500);
    }
  };

  const getSquareColor = (square: Square): ChessSquareColor => chess.squareColor(square);

  const onSquareClick = (square: Square) => {
    if (isGameOver() || turn() !== player()) return;

    const clickedPiece = board()[square];
    const currentSelection = selectedSquare();

    if (!currentSelection) {
      if (!clickedPiece || clickedPiece.color !== player()) return;
      setSelectedSquare(square);
      setValidMoves(chess.moves({ square, verbose: true }).map((m) => m.to as Square));
      return;
    }

    if (currentSelection === square) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    if (clickedPiece && clickedPiece.color === player()) {
      setSelectedSquare(square);
      setValidMoves(chess.moves({ square, verbose: true }).map((m) => m.to as Square));
      return;
    }

    if (validMoves().includes(square)) {
      try {
        const piece = board()[currentSelection];
        const isPawnPromotion = piece?.type === "p" && ((piece.color === "w" && square[1] === "8") || (piece.color === "b" && square[1] === "1"));

        // Get the ID of the piece being moved and captured (if any)
        const movingPieceId = pieceIdMap.get(currentSelection);
        const capturedPieceId = pieceIdMap.get(square);

        const move = chess.move({
          from: currentSelection,
          to: square,
          promotion: isPawnPromotion ? "q" : undefined,
        });

        if (move) {
          const performUpdate = () => {
            batch(() => {
              // Update piece ID mappings: move piece from source to destination
              if (movingPieceId) {
                pieceIdMap.delete(currentSelection);
                pieceIdMap.set(square, movingPieceId);
              }

              syncBoardToStore();
              syncGameState();
              setLastMove({ from: currentSelection, to: square });
              if (move.captured && capturedPieceId) {
                setCapturedPieces((prev) => [...prev, { id: capturedPieceId, color: move.color === "w" ? "b" : "w", type: move.captured! }]);
              }
              setSelectedSquare(null);
              setValidMoves([]);
            });
          };

          // Wrap entire update in view transition for smooth animations
          if (document.startViewTransition) {
            document.startViewTransition(performUpdate);
          } else {
            performUpdate();
          }
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const resetGame = () => {
    chess.reset();
    pieceIdCounter = 1;
    pieceIdMap.clear();

    batch(() => {
      setGameStarted(false);
      setCapturedPieces([]);
      setSelectedSquare(null);
      setLastMove(null);
      setValidMoves([]);
      setBoard(initializeBoardFromChess(chess, generatePieceId, pieceIdMap));
      setTurn(chess.turn());
      setIsCheck(false);
      setIsCheckmate(false);
      setIsGameOver(false);
      setIsDraw(false);
      setIsStalemate(false);
      setIsThreefoldRepetition(false);
      setIsInsufficientMaterial(false);
    });
  };

  return {
    gameStarted,
    onGameStart,
    player,
    setPlayer,
    flip,
    board,
    selectedSquare,
    validMoves,
    lastMove,
    capturedPieces,
    getSquareColor,
    onSquareClick,
    turn,
    isCheck,
    isCheckmate,
    isGameOver,
    isDraw,
    isStalemate,
    isThreefoldRepetition,
    isInsufficientMaterial,
    resetGame,
  };
}

export function chessStore(): ChessStore {
  if (!storeInstance) storeInstance = createChessStore();
  return storeInstance;
}

export type ChessStore = {
  gameStarted: Accessor<boolean>;
  onGameStart: () => void;
  player: Accessor<Color>;
  setPlayer: (color: Color) => void;
  flip: Accessor<boolean>;
  board: Accessor<Record<Square, ChessPieceType | null>>;
  selectedSquare: Accessor<Square | null>;
  validMoves: Accessor<Square[]>;
  lastMove: Accessor<{ from: Square; to: Square } | null>;
  capturedPieces: Accessor<ChessPieceType[]>;
  getSquareColor: (square: Square) => ChessSquareColor;
  onSquareClick: (square: Square) => void;
  turn: Accessor<Color>;
  isCheck: Accessor<boolean>;
  isCheckmate: Accessor<boolean>;
  isGameOver: Accessor<boolean>;
  isDraw: Accessor<boolean>;
  isStalemate: Accessor<boolean>;
  isThreefoldRepetition: Accessor<boolean>;
  isInsufficientMaterial: Accessor<boolean>;
  resetGame: () => void;
};
