import type { Color, Square } from "chess.js";
import { Chess } from "chess.js";
import type { Accessor } from "solid-js";
import { batch, createSignal } from "solid-js";

import { files } from "~/components/ChessCoordinates";
import type { ChessPieceType } from "~/components/ChessPiece";
import { createChessBot } from "~/services/chess-bot";

let storeInstance: ChessStore | null = null;

function initializeBoardFromChess(chess: Chess): Record<Square, ChessPieceType | null> {
  const boardState: Record<string, ChessPieceType | null> = {};
  const chessBoard = chess.board();

  chessBoard.forEach((row, rankIndex) => {
    row.forEach((piece, fileIndex) => {
      const square = `${files[fileIndex]}${8 - rankIndex}` as Square;
      boardState[square] = piece;
    });
  });

  return boardState as Record<Square, ChessPieceType | null>;
}

function createChessStore(): ChessStore {
  const chess = new Chess();

  const [gameStarted, setGameStarted] = createSignal<boolean>(false);
  const [player, setPlayer] = createSignal<Color>("w");
  const [capturedPieces, setCapturedPieces] = createSignal<ChessPieceType[]>([]);
  const [selectedSquare, setSelectedSquare] = createSignal<Square | null>(null);
  const [lastMove, setLastMove] = createSignal<{ from: Square; to: Square } | null>(null);
  const [validMoves, setValidMoves] = createSignal<Square[]>([]);
  const [board, setBoard] = createSignal<Record<Square, ChessPieceType | null>>(initializeBoardFromChess(chess));
  const [turn, setTurn] = createSignal<Color>(chess.turn());
  const [isCheck, setIsCheck] = createSignal<boolean>(chess.isCheck());
  const [isCheckmate, setIsCheckmate] = createSignal<boolean>(chess.isCheckmate());
  const [isGameOver, setIsGameOver] = createSignal<boolean>(chess.isGameOver());

  const syncBoardToStore = () => {
    setTimeout(() => {
      const chessBoard = chess.board();

      const _board = {} as Record<Square, ChessPieceType | null>;
      chessBoard.forEach((row, rankIndex) => {
        row.forEach((piece, fileIndex) => {
          const square = `${files[fileIndex]}${8 - rankIndex}` as Square;
          _board[square] = piece;
        });
      });
      setBoard(_board);
    });
  };

  const syncGameState = () => {
    setTurn(chess.turn());
    setIsCheck(chess.isCheck());
    setIsCheckmate(chess.isCheckmate());
    setIsGameOver(chess.isGameOver());

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
        const result = chess.move(move);

        if (result) {
          batch(() => {
            syncBoardToStore();
            // Update game state without triggering another bot move
            setTurn(chess.turn());
            setIsCheck(chess.isCheck());
            setIsCheckmate(chess.isCheckmate());
            setIsGameOver(chess.isGameOver());
            setLastMove({ from: move.from, to: move.to });
            if (result.captured) {
              setCapturedPieces([...capturedPieces(), { color: result.color === "w" ? "b" : "w", type: result.captured }]);
            }
          });
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

        const move = chess.move({
          from: currentSelection,
          to: square,
          promotion: isPawnPromotion ? "q" : undefined,
        });

        if (move) {
          batch(() => {
            syncBoardToStore();
            syncGameState();
            setLastMove({ from: currentSelection, to: square });
            if (move.captured) {
              setCapturedPieces((prev) => [...prev, { color: move.color === "w" ? "b" : "w", type: move.captured! }]);
            }
            setSelectedSquare(null);
            setValidMoves([]);
          });
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
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
    onSquareClick,
    turn,
    isCheck,
    isCheckmate,
    isGameOver,
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
  onSquareClick: (square: Square) => void;
  turn: Accessor<Color>;
  isCheck: Accessor<boolean>;
  isCheckmate: Accessor<boolean>;
  isGameOver: Accessor<boolean>;
};
