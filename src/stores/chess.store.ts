import type { Color, Square } from "chess.js";
import { Chess } from "chess.js";
import type { Accessor } from "solid-js";
import { batch, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import { files } from "~/components/ChessCoordinates";
import type { ChessPieceType } from "~/components/ChessPiece";
import type { ChessSquareInCheck } from "~/components/ChessSquare";

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
  const [board, setBoard] = createStore<Record<Square, ChessPieceType | null>>(initializeBoardFromChess(chess));
  const [turn, setTurn] = createSignal<Color>(chess.turn());
  const [isCheck, setIsCheck] = createSignal<boolean>(chess.isCheck());
  const [isCheckmate, setIsCheckmate] = createSignal<boolean>(chess.isCheckmate());
  const [isGameOver, setIsGameOver] = createSignal<boolean>(chess.isGameOver());

  const syncBoardToStore = () => {
    const chessBoard = chess.board();

    chessBoard.forEach((row, rankIndex) => {
      row.forEach((piece, fileIndex) => {
        const square = `${files[fileIndex]}${8 - rankIndex}` as Square;
        setBoard(square, piece);
      });
    });
  };

  const syncGameState = () => {
    setTurn(chess.turn());
    setIsCheck(chess.isCheck());
    setIsCheckmate(chess.isCheckmate());
    setIsGameOver(chess.isGameOver());
  };

  const flip = () => player() === "b";
  const getSquarePiece = (square: Square) => board[square];

  const getSquareSelected = (square: Square) => selectedSquare() === square;
  const getSquareLastMove = (square: Square) => {
    const move = lastMove();
    return move ? move.from === square || move.to === square : false;
  };
  const getSquareValidMove = (square: Square) => validMoves().includes(square);

  const getSquareInCheck = (square: Square): ChessSquareInCheck | null => {
    const piece = board[square];
    if (!piece || piece.type !== "k" || piece.color !== turn()) return null;
    if (isCheckmate()) return "checkmate";
    if (isCheck()) return "check";
    return null;
  };

  const onGameStart = () => setGameStarted(true);

  const onSquareClick = (square: Square) => {
    if (isGameOver() || turn() !== player()) return;

    const clickedPiece = board[square];
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
        const piece = board[currentSelection];
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
              setCapturedPieces([...capturedPieces(), { color: move.color === "w" ? "b" : "w", type: move.captured }]);
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
    capturedPieces,
    getSquarePiece,
    getSquareSelected,
    getSquareLastMove,
    getSquareValidMove,
    getSquareInCheck,
    onSquareClick,
    board,
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
  capturedPieces: Accessor<ChessPieceType[]>;
  getSquarePiece: (square: Square) => ChessPieceType | null;
  getSquareSelected: (square: Square) => boolean;
  getSquareLastMove: (square: Square) => boolean;
  getSquareValidMove: (square: Square) => boolean;
  getSquareInCheck: (square: Square) => ChessSquareInCheck | null;
  onSquareClick: (square: Square) => void;
  board: Record<Square, ChessPieceType | null>;
  turn: Accessor<Color>;
  isCheck: Accessor<boolean>;
  isCheckmate: Accessor<boolean>;
  isGameOver: Accessor<boolean>;
};
