import type { Color, Square } from "chess.js";
import { Chess } from "chess.js";
import type { Accessor } from "solid-js";
import { createSignal } from "solid-js";

import type { ChessPieceType } from "~/components/ChessPiece";
import type { ChessSquareInCheck } from "~/components/ChessSquare";

export function chessStore(): ChessStore {
  const chess = new Chess();

  const [gameStarted, setGameStarted] = createSignal<boolean>(false);
  const [player, setPlayer] = createSignal<Color>("w");
  const [capturedPieces, setCapturedPieces] = createSignal<ChessPieceType[]>([]);
  const [selectedSquare, setSelectedSquare] = createSignal<Square | null>(null);
  const [lastMove, setLastMove] = createSignal<{ from: Square; to: Square } | null>(null);
  const [validMoves, setValidMoves] = createSignal<Square[]>([]);

  const flip = () => player() === "b";

  const getSquarePiece = (square: Square) => chess.get(square) || null;
  const getSquareSelected = (square: Square) => selectedSquare() === square;
  const getSquareLastMove = (square: Square) => {
    const move = lastMove();
    return move ? move.from === square || move.to === square : false;
  };
  const getSquareValidMove = (square: Square) => validMoves().includes(square);
  const getSquareInCheck = (square: Square): ChessSquareInCheck | null => null;

  const onGameStart = () => setGameStarted(true);

  const onSquareClick = (square: Square) => {
    setSelectedSquare(square);
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
  };
}

export type ChessStore = {
  gameStarted: Accessor<boolean>;
  onGameStart: () => void;
  player: Accessor<Color>;
  setPlayer: (color: Color) => void;
  flip: () => boolean;
  capturedPieces: Accessor<ChessPieceType[]>;
  getSquarePiece: (square: Square) => ChessPieceType | null;
  getSquareSelected: (square: Square) => boolean;
  getSquareLastMove: (square: Square) => boolean;
  getSquareValidMove: (square: Square) => boolean;
  getSquareInCheck: (square: Square) => ChessSquareInCheck | null;
  onSquareClick: (square: Square) => void;
};
