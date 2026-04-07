import { isAttacked } from "./attacks";
import type { ChessBoard } from "./board";
import { SQ_NAMES, fileOf, rankOf } from "./constants";
import { generateLegal, lsb } from "./movegen";
import { MoveFlags, Piece } from "./types";
import type { Move } from "./types";

const PIECE_CHAR = [" ", "N", "B", "R", "Q", "K"];

export function toSan(move: Move, board: ChessBoard, legal: Move[]): string {
  const { from, to, piece, color, flags } = move;

  if (flags & MoveFlags.CastleKing) return "O-O";
  if (flags & MoveFlags.CastleQueen) return "O-O-O";

  let san: string;

  if (piece === Piece.Pawn) {
    if (flags & MoveFlags.Capture) {
      san = SQ_NAMES[from][0] + "x" + SQ_NAMES[to];
    } else {
      san = SQ_NAMES[to];
    }
    if (flags & MoveFlags.Promotion) {
      san += "=" + PIECE_CHAR[move.promotion];
    }
  } else {
    const pieceChar = PIECE_CHAR[piece];
    const ambiguous = legal.filter((m) => m.piece === piece && m.color === color && m.to === to && m.from !== from);

    let disambig = "";
    if (ambiguous.length > 0) {
      const sameFile = ambiguous.some((m) => fileOf(m.from) === fileOf(from));
      const sameRank = ambiguous.some((m) => rankOf(m.from) === rankOf(from));
      if (!sameFile) {
        disambig = SQ_NAMES[from][0];
      } else if (!sameRank) {
        disambig = SQ_NAMES[from][1];
      } else {
        disambig = SQ_NAMES[from];
      }
    }

    san = pieceChar + disambig + (flags & MoveFlags.Capture ? "x" : "") + SQ_NAMES[to];
  }

  board.makeMove(move);
  const opp = (color ^ 1) as typeof color;
  const newOcc = board.allOccupied();
  const oppKingSq = lsb(board.pieces[opp][Piece.King]);

  if (isAttacked(oppKingSq, color, board, newOcc)) {
    const oppLegal = generateLegal(board);
    san += oppLegal.length === 0 ? "#" : "+";
  }
  board.unmakeMove();

  return san;
}
