export const Piece = { Pawn: 0, Knight: 1, Bishop: 2, Rook: 3, Queen: 4, King: 5, None: 7 } as const;
export type Piece = (typeof Piece)[keyof typeof Piece];

export const Color = { White: 1, Black: 0 } as const;
export type Color = (typeof Color)[keyof typeof Color];

export type Square = number;
export type BitBoard = bigint;

export const MoveFlags = {
  Normal: 0,
  DoublePush: 1 << 0,
  EnPassant: 1 << 1,
  CastleKing: 1 << 2,
  CastleQueen: 1 << 3,
  Promotion: 1 << 4,
  Capture: 1 << 5,
} as const;
export type MoveFlags = number;

export type Move = {
  from: Square;
  to: Square;
  piece: Piece;
  color: Color;
  captured: Piece;
  promotion: Piece;
  flags: MoveFlags;
};

/**
 * Encoded move:
 * - bits  0– 5: from      (6 bits)
 * - bits  6–11: to        (6 bits)
 * - bits 12–14: piece     (3 bits)
 * - bits 15–17: captured  (3 bits, 7=Piece.None)
 * - bits 18–20: promotion (3 bits, 7=Piece.None)
 * - bits 21:    color     (1 bit)
 * - bits 22–26: flags     (5 bits)
 */
export function encodeMove(m: Move): number {
  return (
    (m.from & 0x3f) |
    ((m.to & 0x3f) << 6) |
    ((m.piece & 0x7) << 12) |
    ((m.captured & 0x7) << 15) |
    ((m.promotion & 0x7) << 18) |
    ((m.color & 0x1) << 21) |
    ((m.flags & 0x1f) << 22)
  );
}

/**
 * Encoded move:
 * - bits  0– 5: from      (6 bits)
 * - bits  6–11: to        (6 bits)
 * - bits 12–14: piece     (3 bits)
 * - bits 15–17: captured  (3 bits, 7=Piece.None)
 * - bits 18–20: promotion (3 bits, 7=Piece.None)
 * - bits 21:    color     (1 bit)
 * - bits 22–26: flags     (5 bits)
 */
export function decodeMove(m: number): Move {
  return {
    from: m & 0x3f,
    to: (m >> 6) & 0x3f,
    piece: ((m >> 12) & 0x7) as Piece,
    captured: ((m >> 15) & 0x7) as Piece,
    promotion: ((m >> 18) & 0x7) as Piece,
    color: ((m >> 21) & 0x1) as Color,
    flags: (m >> 22) & 0x1f,
  };
}
