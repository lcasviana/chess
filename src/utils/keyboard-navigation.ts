import type { Square } from "chess.js";

/**
 * Parse a square notation into file and rank indices
 * @param square - Square notation (e.g., 'e4')
 * @returns Object with fileIndex (0-7) and rankIndex (0-7)
 * @example parseSquare('e4') => { fileIndex: 4, rankIndex: 3 }
 */
export function parseSquare(square: Square): { fileIndex: number; rankIndex: number } {
  const file = square[0]; // 'a' to 'h'
  const rank = parseInt(square[1], 10); // 1 to 8

  const fileIndex = file.charCodeAt(0) - "a".charCodeAt(0); // 0-7 (a=0, h=7)
  const rankIndex = rank - 1; // 0-7 (1=0, 8=7)

  return { fileIndex, rankIndex };
}

/**
 * Convert file and rank indices back to square notation
 * @param fileIndex - File index (0-7)
 * @param rankIndex - Rank index (0-7)
 * @returns Square notation or null if out of bounds
 * @example toSquare(4, 3) => 'e4'
 */
export function toSquare(fileIndex: number, rankIndex: number): Square | null {
  if (fileIndex < 0 || fileIndex > 7 || rankIndex < 0 || rankIndex > 7) {
    return null; // Out of bounds
  }

  const file = String.fromCharCode("a".charCodeAt(0) + fileIndex);
  const rank = rankIndex + 1;

  return `${file}${rank}` as Square;
}

/**
 * Invert direction for flipped board
 * @param direction - Original direction
 * @returns Inverted direction
 */
function invertDirection(direction: "up" | "down" | "left" | "right"): "up" | "down" | "left" | "right" {
  switch (direction) {
    case "up":
      return "down";
    case "down":
      return "up";
    case "left":
      return "right";
    case "right":
      return "left";
  }
}

/**
 * Calculate the adjacent square based on arrow key direction
 * Handles board flip automatically
 * @param currentSquare - Current square position
 * @param direction - Direction to move (up/down/left/right)
 * @param isBoardFlipped - Whether the board is flipped (player is black)
 * @returns Adjacent square or null if move would go off the board
 * @example getAdjacentSquare('e4', 'up', false) => 'e5'
 */
export function getAdjacentSquare(currentSquare: Square, direction: "up" | "down" | "left" | "right", isBoardFlipped: boolean): Square | null {
  const { fileIndex, rankIndex } = parseSquare(currentSquare);

  let newFileIndex = fileIndex;
  let newRankIndex = rankIndex;

  // Apply board flip transformation
  const effectiveDirection = isBoardFlipped ? invertDirection(direction) : direction;

  switch (effectiveDirection) {
    case "up":
      newRankIndex += 1; // Increase rank (1→2, 7→8)
      break;
    case "down":
      newRankIndex -= 1; // Decrease rank (8→7, 2→1)
      break;
    case "right":
      newFileIndex += 1; // Increase file (a→b, g→h)
      break;
    case "left":
      newFileIndex -= 1; // Decrease file (h→g, b→a)
      break;
  }

  return toSquare(newFileIndex, newRankIndex);
}
