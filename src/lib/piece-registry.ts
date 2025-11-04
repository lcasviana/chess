/**
 * Chess Piece Registry
 *
 * This module provides a piece identity tracking system for chess games.
 * It maintains stable piece IDs throughout the game lifecycle, enabling
 * features like view transitions, move history, and piece-specific analytics.
 *
 * ## Important Notes on Mutability
 *
 * This module uses mutable data structures (Maps and Sets) for performance optimization.
 * When using with reactive frameworks (e.g., Solid.js, React), you are responsible for
 * triggering reactivity:
 *
 * @example
 * // Solid.js usage
 * const [registry, setRegistry] = createSignal(initializePieceRegistry(game));
 *
 * // After a move, trigger reactivity by spreading the registry
 * handlePieceMove(registry(), from, to, captureInfo);
 * setRegistry({...registry()}); // Trigger reactivity
 *
 * // Or create a new registry reference
 * setRegistry(() => {
 *   const newRegistry = {...registry()};
 *   handlePieceMove(newRegistry, from, to, captureInfo);
 *   return newRegistry;
 * });
 *
 * ## Validation Philosophy
 *
 * All move functions assume that moves have been pre-validated by chess.js.
 * Input validation in this module is defensive - it checks for registry consistency
 * and catches programming errors, but does NOT validate chess rules.
 *
 * @module piece-registry
 */

import type { Chess, Color, PieceSymbol, Square } from "chess.js";

import { squares } from "~/components/ChessBoard";

/**
 * Utilities for parsing chess square notation
 */

/**
 * Extracts the file (column) letter from a square.
 * @param square - Chess square in algebraic notation (e.g., "e4")
 * @returns The file letter ('a'-'h')
 */
const getFileFromSquare = (square: Square): string => {
  return square[0];
};

/**
 * Extracts the rank (row) number from a square.
 * @param square - Chess square in algebraic notation (e.g., "e4")
 * @returns The rank number ('1'-'8')
 */
const getRankFromSquare = (square: Square): string => {
  return square[1];
};

/**
 * Calculates the difference in files between two squares.
 * Positive means toSquare is to the right, negative means to the left.
 * @param fromSquare - Starting square
 * @param toSquare - Ending square
 * @returns Number of files difference (-7 to 7)
 */
const getFileDifference = (fromSquare: Square, toSquare: Square): number => {
  return toSquare.charCodeAt(0) - fromSquare.charCodeAt(0);
};

/**
 * Validates that a square string is a valid chess square.
 * @param square - Square to validate
 * @returns true if valid
 */
const isValidSquare = (square: string): square is Square => {
  return /^[a-h][1-8]$/.test(square);
};

/**
 * Valid piece symbols for promotion
 */
const PROMOTION_PIECES: PieceSymbol[] = ["q", "r", "b", "n"];

/**
 * Represents the identity and state of a single chess piece.
 * This persists throughout the game, even if the piece is captured.
 */
export interface PieceIdentity {
  /** Stable unique identifier (format: "{color}-{type}-{occurrence}", e.g., "w-p-1") */
  id: string;
  /** Piece color (w = white, b = black) */
  color: Color;
  /** Piece type (p, n, b, r, q, k) - can change via promotion */
  type: PieceSymbol;
  /** The square where this piece started the game (immutable) */
  startingSquare: Square;
  /** The current or last known square of the piece */
  currentSquare: Square;
  /** Whether this piece has been captured */
  captured: boolean;
  /** Number of times this piece has moved */
  moveCount: number;
}

/**
 * A registry that tracks all pieces and their locations throughout a chess game.
 * Provides dual-index lookup optimization: by piece ID and by board square.
 *
 * Note: This registry uses mutable data structures (Maps and Sets) for performance.
 * When using with reactive frameworks (e.g., Solid.js), ensure you trigger
 * reactivity by creating a new registry reference when needed.
 */
export interface PieceRegistry {
  /** Map of piece ID to piece identity - primary source of truth */
  byId: Map<string, PieceIdentity>;
  /** Map of square to piece ID - for fast position-based lookups */
  bySquare: Map<Square, string>;
  /** Set of captured piece IDs - for fast enumeration of captured pieces */
  captured: Set<string>;
}

/**
 * Represents a completed move transition with metadata.
 * Used for move history tracking and debugging.
 */
export interface MoveTransition {
  /** ID of the piece that moved */
  pieceId: string;
  /** Square the piece moved from */
  fromSquare: Square;
  /** Square the piece moved to */
  toSquare: Square;
  /** ID of any piece that was captured during this move */
  capturedPieceId?: string;
  /** Unix timestamp when the move was recorded */
  timestamp: number;
}

/**
 * Initializes a piece registry from a chess.js game instance.
 * Scans all 64 squares and creates stable piece identities for each piece found.
 *
 * @param game - A chess.js Chess instance
 * @returns A new PieceRegistry with all pieces registered and indexed
 */
export const initializePieceRegistry = (game: Chess): PieceRegistry => {
  const registry: PieceRegistry = {
    byId: new Map(),
    bySquare: new Map(),
    captured: new Set(),
  };

  // Counter for each piece type+color combination
  const pieceCounters: Record<string, number> = {};

  // Iterate through all squares in the starting position
  for (const square of squares) {
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

/**
 * Handles a standard piece move, updating the registry and tracking captures.
 *
 * Note: This function assumes the move has already been validated by chess.js.
 * It only updates the piece registry to reflect the move.
 *
 * @param registry - The piece registry to update
 * @param fromSquare - The square the piece is moving from
 * @param toSquare - The square the piece is moving to
 * @param capturedInfo - Optional information about a captured piece
 * @returns A MoveTransition object containing details about the move
 * @throws {Error} If no piece exists at fromSquare or registry state is inconsistent
 */
export const handlePieceMove = (
  registry: PieceRegistry,
  fromSquare: Square,
  toSquare: Square,
  capturedInfo?: { type: PieceSymbol; color: Color },
): MoveTransition => {
  // Validate piece exists at source square
  const pieceId = registry.bySquare.get(fromSquare);
  if (!pieceId) {
    throw new Error(`No piece found at ${fromSquare}`);
  }

  const piece = registry.byId.get(pieceId);
  if (!piece) {
    throw new Error(`Invalid piece ID: ${pieceId} - registry state is inconsistent`);
  }

  // Validate piece is not already captured
  if (piece.captured) {
    throw new Error(`Cannot move captured piece ${pieceId} at ${fromSquare}`);
  }

  let capturedPieceId: string | undefined;

  // Handle capture
  if (capturedInfo) {
    const targetPieceId = registry.bySquare.get(toSquare);

    if (!targetPieceId) {
      throw new Error(
        `Capture info provided but no piece found at destination ${toSquare}. ` + `Expected ${capturedInfo.color} ${capturedInfo.type}`,
      );
    }

    const targetPiece = registry.byId.get(targetPieceId);
    if (!targetPiece) {
      throw new Error(`Invalid target piece ID: ${targetPieceId} - registry state is inconsistent`);
    }

    // Validate captured piece info matches
    if (targetPiece.type !== capturedInfo.type || targetPiece.color !== capturedInfo.color) {
      throw new Error(
        `Captured piece mismatch at ${toSquare}: expected ${capturedInfo.color} ${capturedInfo.type}, ` +
          `found ${targetPiece.color} ${targetPiece.type}`,
      );
    }

    // Validate capturing opposite color
    if (piece.color === targetPiece.color) {
      throw new Error(
        `Cannot capture own piece: ${piece.color} ${piece.type} at ${fromSquare} ` +
          `cannot capture ${targetPiece.color} ${targetPiece.type} at ${toSquare}`,
      );
    }

    targetPiece.captured = true;
    targetPiece.currentSquare = toSquare; // Keep reference to last position
    registry.captured.add(targetPieceId);
    capturedPieceId = targetPieceId;
  } else {
    // If no capture info, validate destination is empty
    const existingPiece = registry.bySquare.get(toSquare);
    if (existingPiece) {
      throw new Error(
        `Destination square ${toSquare} is occupied but no capture info provided. ` + `Use capturedInfo parameter when capturing pieces.`,
      );
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

/**
 * Handles castling moves by updating the rook's position in the registry.
 *
 * Note: This function assumes the castling move has already been validated by chess.js.
 * It only updates the piece registry to reflect the rook's movement.
 *
 * @param registry - The piece registry to update
 * @param kingMove - The king's move from/to squares
 * @throws {Error} If the king move is invalid or rook is not found at expected position
 */
export const handleCastling = (registry: PieceRegistry, kingMove: { from: Square; to: Square }): void => {
  const fileDiff = getFileDifference(kingMove.from, kingMove.to);
  const rank = getRankFromSquare(kingMove.from);

  // Validate this is a castling move (king moves exactly 2 squares horizontally)
  if (Math.abs(fileDiff) !== 2) {
    throw new Error(
      `Invalid castling move: king must move exactly 2 squares, but moved ${Math.abs(fileDiff)} squares from ${kingMove.from} to ${kingMove.to}`,
    );
  }

  // Validate rank consistency
  if (getRankFromSquare(kingMove.to) !== rank) {
    throw new Error(`Invalid castling move: king changed ranks from ${kingMove.from} to ${kingMove.to}`);
  }

  let rookFrom: Square;
  let rookTo: Square;

  if (fileDiff === 2) {
    // Kingside castling - rook moves from h-file to f-file
    rookFrom = `h${rank}` as Square;
    rookTo = `f${rank}` as Square;
  } else {
    // Queenside castling - rook moves from a-file to d-file
    rookFrom = `a${rank}` as Square;
    rookTo = `d${rank}` as Square;
  }

  // Validate and move the rook
  const rookId = registry.bySquare.get(rookFrom);
  if (!rookId) {
    throw new Error(`No rook found at ${rookFrom} for castling`);
  }

  const rook = registry.byId.get(rookId);
  if (!rook) {
    throw new Error(`Invalid rook ID: ${rookId}`);
  }

  // Validate it's actually a rook
  if (rook.type !== "r") {
    throw new Error(`Piece at ${rookFrom} is not a rook, it's a ${rook.type}`);
  }

  // Update rook position
  registry.bySquare.delete(rookFrom);
  rook.currentSquare = rookTo;
  rook.moveCount++;
  registry.bySquare.set(rookTo, rookId);
};

/**
 * Handles en passant captures by removing the captured pawn from the registry.
 *
 * Note: This function assumes the en passant move has already been validated by chess.js.
 * It only updates the piece registry to reflect the captured pawn removal.
 *
 * @param registry - The piece registry to update
 * @param pawnMove - The attacking pawn's move from/to squares
 * @param capturedPawnSquare - The square where the captured pawn is located (not the destination square)
 * @throws {Error} If no pawn exists at capturedPawnSquare or the move is invalid
 */
export const handleEnPassant = (registry: PieceRegistry, pawnMove: { from: Square; to: Square }, capturedPawnSquare: Square): void => {
  // Validate the moving pawn exists
  const movingPawnId = registry.bySquare.get(pawnMove.from);
  if (!movingPawnId) {
    throw new Error(`No pawn found at ${pawnMove.from} for en passant move`);
  }

  const movingPawn = registry.byId.get(movingPawnId);
  if (!movingPawn) {
    throw new Error(`Invalid pawn ID: ${movingPawnId} - registry state is inconsistent`);
  }

  // Validate it's actually a pawn
  if (movingPawn.type !== "p") {
    throw new Error(`Piece at ${pawnMove.from} is not a pawn, it's a ${movingPawn.type}`);
  }

  // Validate the captured pawn exists
  const capturedPieceId = registry.bySquare.get(capturedPawnSquare);
  if (!capturedPieceId) {
    throw new Error(`No piece found at ${capturedPawnSquare} for en passant capture`);
  }

  const capturedPiece = registry.byId.get(capturedPieceId);
  if (!capturedPiece) {
    throw new Error(`Invalid captured piece ID: ${capturedPieceId} - registry state is inconsistent`);
  }

  // Validate captured piece is a pawn
  if (capturedPiece.type !== "p") {
    throw new Error(`Piece at ${capturedPawnSquare} is not a pawn, it's a ${capturedPiece.type}`);
  }

  // Validate pawns are opposite colors
  if (movingPawn.color === capturedPiece.color) {
    throw new Error(
      `Cannot capture own pawn: ${movingPawn.color} pawn at ${pawnMove.from} ` +
        `cannot capture ${capturedPiece.color} pawn at ${capturedPawnSquare}`,
    );
  }

  // Validate en passant geometry: captured pawn should be on same rank as from square
  if (getRankFromSquare(capturedPawnSquare) !== getRankFromSquare(pawnMove.from)) {
    throw new Error(`Invalid en passant: captured pawn at ${capturedPawnSquare} must be on same rank as moving pawn at ${pawnMove.from}`);
  }

  // Validate diagonal move (file changes by 1, rank changes by 1)
  const fileDiff = Math.abs(getFileDifference(pawnMove.from, pawnMove.to));
  const fromRank = parseInt(getRankFromSquare(pawnMove.from));
  const toRank = parseInt(getRankFromSquare(pawnMove.to));
  const rankDiff = Math.abs(toRank - fromRank);

  if (fileDiff !== 1 || rankDiff !== 1) {
    throw new Error(
      `Invalid en passant move: pawn must move diagonally by 1 square, ` +
        `but moved ${fileDiff} files and ${rankDiff} ranks from ${pawnMove.from} to ${pawnMove.to}`,
    );
  }

  // Mark pawn as captured and remove from board
  capturedPiece.captured = true;
  registry.captured.add(capturedPieceId);
  registry.bySquare.delete(capturedPawnSquare);
};

/**
 * Handles pawn promotion by updating the piece type in the registry.
 *
 * Note: This function assumes the promotion has already been validated by chess.js.
 * It only updates the piece registry to reflect the new piece type.
 *
 * @param registry - The piece registry to update
 * @param square - The square where the promotion occurs (rank 8 for white, rank 1 for black)
 * @param promotedTo - The piece type to promote to (q, r, b, or n)
 * @throws {Error} If no pawn exists at the square or promotion is invalid
 */
export const handlePromotion = (registry: PieceRegistry, square: Square, promotedTo: PieceSymbol): void => {
  // Validate piece exists at the square
  const pieceId = registry.bySquare.get(square);
  if (!pieceId) {
    throw new Error(`No piece found at ${square} for promotion`);
  }

  const piece = registry.byId.get(pieceId);
  if (!piece) {
    throw new Error(`Invalid piece ID: ${pieceId} - registry state is inconsistent`);
  }

  // Validate it's actually a pawn
  if (piece.type !== "p") {
    throw new Error(`Cannot promote ${piece.type} at ${square} - only pawns can be promoted`);
  }

  // Validate promotion piece
  if (!PROMOTION_PIECES.includes(promotedTo)) {
    throw new Error(`Invalid promotion piece: ${promotedTo}. Must be one of: ${PROMOTION_PIECES.join(", ")}`);
  }

  // Validate promotion rank (8 for white, 1 for black)
  const rank = getRankFromSquare(square);
  const expectedRank = piece.color === "w" ? "8" : "1";

  if (rank !== expectedRank) {
    throw new Error(`Invalid promotion rank: ${piece.color} pawn at ${square} must be on rank ${expectedRank} to promote`);
  }

  // Update the piece type to the promoted piece
  piece.type = promotedTo;
};

/**
 * Retrieves the piece ID at a given square.
 *
 * @param registry - The piece registry to query
 * @param square - The square to check
 * @returns The piece ID if a piece exists at the square, undefined otherwise
 */
export const getPieceIdAtSquare = (registry: PieceRegistry, square: Square): string | undefined => {
  return registry.bySquare.get(square);
};

/**
 * Retrieves a piece's identity by its ID.
 *
 * @param registry - The piece registry to query
 * @param id - The piece ID to look up
 * @returns The PieceIdentity if found, undefined otherwise
 */
export const getPieceById = (registry: PieceRegistry, id: string): PieceIdentity | undefined => {
  return registry.byId.get(id);
};

/**
 * Retrieves all captured pieces, grouped by which player captured them.
 *
 * @param registry - The piece registry to query
 * @returns Object with 'white' array (pieces captured by white) and 'black' array (pieces captured by black)
 */
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
