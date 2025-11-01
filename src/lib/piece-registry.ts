import type { Chess, Color, PieceSymbol, Square } from "chess.js";

export interface PieceIdentity {
  id: string;
  color: Color;
  type: PieceSymbol;
  startingSquare: Square;
  currentSquare: Square;
  captured: boolean;
  moveCount: number;
}

export interface PieceRegistry {
  byId: Map<string, PieceIdentity>;
  bySquare: Map<Square, string>;
  captured: Set<string>;
}

export interface MoveTransition {
  pieceId: string;
  fromSquare: Square;
  toSquare: Square;
  capturedPieceId?: string;
  timestamp: number;
}

const allSquares: Square[] = [
  "a1",
  "b1",
  "c1",
  "d1",
  "e1",
  "f1",
  "g1",
  "h1",
  "a2",
  "b2",
  "c2",
  "d2",
  "e2",
  "f2",
  "g2",
  "h2",
  "a3",
  "b3",
  "c3",
  "d3",
  "e3",
  "f3",
  "g3",
  "h3",
  "a4",
  "b4",
  "c4",
  "d4",
  "e4",
  "f4",
  "g4",
  "h4",
  "a5",
  "b5",
  "c5",
  "d5",
  "e5",
  "f5",
  "g5",
  "h5",
  "a6",
  "b6",
  "c6",
  "d6",
  "e6",
  "f6",
  "g6",
  "h6",
  "a7",
  "b7",
  "c7",
  "d7",
  "e7",
  "f7",
  "g7",
  "h7",
  "a8",
  "b8",
  "c8",
  "d8",
  "e8",
  "f8",
  "g8",
  "h8",
];

export const initializePieceRegistry = (game: Chess): PieceRegistry => {
  const registry: PieceRegistry = {
    byId: new Map(),
    bySquare: new Map(),
    captured: new Set(),
  };

  // Counter for each piece type+color combination
  const pieceCounters: Record<string, number> = {};

  // Iterate through all squares in the starting position
  for (const square of allSquares) {
    const piece = game.get(square);
    if (piece) {
      const key = `${piece.color}_${piece.type}`;
      pieceCounters[key] = (pieceCounters[key] ?? 0) + 1;

      // Create stable ID based on color, type, and occurrence order
      const id = `${piece.color}-${piece.type}-${pieceCounters[key]}`;

      const identity: PieceIdentity = {
        id,
        color: piece.color,
        type: piece.type,
        startingSquare: square,
        currentSquare: square,
        captured: false,
        moveCount: 0,
      };

      registry.byId.set(id, identity);
      registry.bySquare.set(square, id);
    }
  }

  return registry;
};

export const handlePieceMove = (
  registry: PieceRegistry,
  fromSquare: Square,
  toSquare: Square,
  capturedInfo?: { type: PieceSymbol; color: Color },
): MoveTransition => {
  const pieceId = registry.bySquare.get(fromSquare);
  if (!pieceId) {
    throw new Error(`No piece found at ${fromSquare}`);
  }

  const piece = registry.byId.get(pieceId);
  if (!piece) {
    throw new Error(`Invalid piece ID: ${pieceId}`);
  }

  let capturedPieceId: string | undefined;

  // Handle capture
  if (capturedInfo) {
    const targetPieceId = registry.bySquare.get(toSquare);
    if (targetPieceId) {
      const targetPiece = registry.byId.get(targetPieceId);
      if (targetPiece) {
        targetPiece.captured = true;
        targetPiece.currentSquare = toSquare; // Keep reference to last position
        registry.captured.add(targetPieceId);
        capturedPieceId = targetPieceId;
      }
    }
  }

  // Update the moving piece
  registry.bySquare.delete(fromSquare);
  piece.currentSquare = toSquare;
  piece.moveCount++;
  registry.bySquare.set(toSquare, pieceId);

  return {
    pieceId,
    fromSquare,
    toSquare,
    capturedPieceId,
    timestamp: Date.now(),
  };
};

export const handleCastling = (registry: PieceRegistry, kingMove: { from: Square; to: Square }): void => {
  // Determine if this is kingside or queenside castling
  const fromFile = kingMove.from.charCodeAt(0);
  const toFile = kingMove.to.charCodeAt(0);
  const rank = kingMove.from[1];

  if (toFile - fromFile === 2) {
    // Kingside castling - rook moves from h to f
    const rookFrom = `h${rank}` as Square;
    const rookTo = `f${rank}` as Square;

    const rookId = registry.bySquare.get(rookFrom);
    if (rookId) {
      const rook = registry.byId.get(rookId);
      if (rook) {
        registry.bySquare.delete(rookFrom);
        rook.currentSquare = rookTo;
        rook.moveCount++;
        registry.bySquare.set(rookTo, rookId);
      }
    }
  } else if (fromFile - toFile === 2) {
    // Queenside castling - rook moves from a to d
    const rookFrom = `a${rank}` as Square;
    const rookTo = `d${rank}` as Square;

    const rookId = registry.bySquare.get(rookFrom);
    if (rookId) {
      const rook = registry.byId.get(rookId);
      if (rook) {
        registry.bySquare.delete(rookFrom);
        rook.currentSquare = rookTo;
        rook.moveCount++;
        registry.bySquare.set(rookTo, rookId);
      }
    }
  }
};

export const handleEnPassant = (registry: PieceRegistry, pawnMove: { from: Square; to: Square }, capturedPawnSquare: Square): void => {
  const capturedPieceId = registry.bySquare.get(capturedPawnSquare);
  if (capturedPieceId) {
    const capturedPiece = registry.byId.get(capturedPieceId);
    if (capturedPiece) {
      capturedPiece.captured = true;
      registry.captured.add(capturedPieceId);
      registry.bySquare.delete(capturedPawnSquare);
    }
  }
};

export const handlePromotion = (registry: PieceRegistry, square: Square, promotedTo: PieceSymbol): void => {
  const pieceId = registry.bySquare.get(square);
  if (pieceId) {
    const piece = registry.byId.get(pieceId);
    if (piece) {
      // Update the piece type to the promoted piece
      piece.type = promotedTo;
    }
  }
};

export const getPieceIdAtSquare = (registry: PieceRegistry, square: Square): string | undefined => {
  return registry.bySquare.get(square);
};

export const getPieceById = (registry: PieceRegistry, id: string): PieceIdentity | undefined => {
  return registry.byId.get(id);
};

export const getCapturedPieces = (registry: PieceRegistry): { white: PieceIdentity[]; black: PieceIdentity[] } => {
  const white: PieceIdentity[] = [];
  const black: PieceIdentity[] = [];

  for (const pieceId of registry.captured) {
    const piece = registry.byId.get(pieceId);
    if (piece) {
      if (piece.color === "w") {
        black.push(piece); // Black captured white pieces
      } else {
        white.push(piece); // White captured black pieces
      }
    }
  }

  return { white, black };
};
