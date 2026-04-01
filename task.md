# Replace chess.js with Custom Bitboard Engine

## Goal

Replace `chess.js` with a performance-first TypeScript bitboard engine. The core engine uses only numeric types throughout. A thin adapter wraps it at the end to restore the existing app's API surface — that adapter is a secondary concern, not a design driver.

---

## Design Principles

- All engine types are **numbers** — no string-based Color/Square/Piece in the hot path
- `const object + type` pattern (not `const enum`) for runtime-accessible value sets:

  ```typescript
  const Piece = { Pawn: 0, Knight: 1, Bishop: 2, Rook: 3, Queen: 4, King: 5, None: 7 } as const;
  type Piece = (typeof Piece)[keyof typeof Piece]; // 0|1|2|3|4|5|7

  const Color = { White: 1, Black: 0 } as const;
  type Color = (typeof Color)[keyof typeof Color]; // 0|1

  // Opponent: color ^ 1 (works for both White=1, Black=0)
  ```

- `Square` is `number` (0–63): `a1=0, b1=1, …, h1=7, a2=8, …, h8=63`
- `Bitboard` is `bigint` — 64-bit, one bit per square
- Move list uses **plain numeric-field objects** in the engine; avoid string fields entirely until the adapter layer. Consider **packed 32-bit int moves** as a future optimization.
- Attack tables are flat `bigint[]` arrays (index = square), computed once at module load
- `makeMove`/`unmakeMove` (never copy-on-write) — XOR trick keeps both paths to 1–2 ops per bitboard

---

## File Structure

```
src/chess/
├── types.ts       — All numeric engine types: Piece, Color, Square, MoveFlags, Move, Bitboard
├── constants.ts   — Bitboard masks (files, ranks); square helpers (sqBB, fileOf, rankOf)
├── attacks.ts     — Precomputed knight/king/pawn tables; HQ sliding attacks; isAttacked()
├── board.ts       — ChessBoard class: 12 bitboards, makeMove, unmakeMove, Zobrist
├── movegen.ts     — Pseudo-legal generation + legal filtering
├── fen.ts         — FEN ↔ board state (pure functions)
├── san.ts         — SAN string from a numeric Move (disambiguation, +/# suffix)
├── chess.ts       — Engine façade with numeric API (no chess.js compat here)
├── adapter.ts     — chess.js-compatible string API (Color="w"|"b", Square="a1" etc.)
└── index.ts       — Public exports (re-exports adapter types + Chess class)
```

---

## Phase 1 — types.ts

### Core value types

```typescript
export const Piece = { Pawn: 0, Knight: 1, Bishop: 2, Rook: 3, Queen: 4, King: 5, None: 7 } as const;
export type Piece = (typeof Piece)[keyof typeof Piece];

export const Color = { White: 1, Black: 0 } as const;
export type Color = (typeof Color)[keyof typeof Color];

export type Square = number; // 0–63
export type Bitboard = bigint;
```

### MoveFlags (bitmask)

```typescript
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
```

### Move (engine-internal — all numbers)

```typescript
export interface Move {
  from: Square;
  to: Square;
  piece: Piece;
  color: Color;
  captured: Piece; // Piece.None if not a capture
  promotion: Piece; // Piece.None if not a promotion
  flags: MoveFlags;
  san: string; // filled in after legality check
}
```

**Packed move optimization** (for search-intensive paths): encode a move into a single 32-bit integer. Bit layout (27 bits used, fits in a JS safe integer):

```
bits  0– 5: from       (6 bits)
bits  6–11: to         (6 bits)
bits 12–14: piece      (3 bits)
bits 15–17: captured   (3 bits, 7=Piece.None)
bits 18–20: promotion  (3 bits, 7=Piece.None)
bits 21:    color      (1 bit)
bits 22–26: flags      (5 bits)
```

Implement `encodeMove(…): number` and `decodeMove(m: number): Move` helpers. The bot's minimax can store move lists as `number[]` — avoids GC pressure from object arrays.

---

## Phase 2 — constants.ts

### Square helpers

```typescript
// a1=0 … h1=7, a2=8 … h8=63
export const sqBB   = (s: Square): Bitboard => 1n << BigInt(s)
export const fileOf = (s: Square): number => s & 7          // 0=a … 7=h
export const rankOf = (s: Square): number => s >> 3         // 0=rank1 … 7=rank8
export const sqOf   = (file: number, rank: number): Square => rank * 8 + file

// String ↔ number (used only in adapter)
export const SQ_NAMES: string[] = /* "a1"…"h8", index = square number */
export const SQ_INDEX: Record<string, Square> = /* reverse lookup */
```

### Bitboard masks

```typescript
export const BB_EMPTY = 0n;
export const BB_FULL = 0xffff_ffff_ffff_ffffn;

export const FILE_A = 0x0101010101010101n;
export const FILE_B = FILE_A << 1n;
// …
export const FILE_H = 0x8080808080808080n;
export const NOT_FILE_A = ~FILE_A & BB_FULL;
export const NOT_FILE_H = ~FILE_H & BB_FULL;
export const NOT_FILE_AB = NOT_FILE_A & ~FILE_B & BB_FULL;
export const NOT_FILE_GH = NOT_FILE_H & ~(FILE_A << 6n) & BB_FULL;

export const RANK_1 = 0x00000000000000ffn;
export const RANK_2 = RANK_1 << 8n;
// …
export const RANK_8 = 0xff00000000000000n;

export const RANK_MASKS: Bitboard[8]; // indexed by rank 0–7
export const FILE_MASKS: Bitboard[8]; // indexed by file 0–7
```

### Precomputed diag/anti-diag masks

```typescript
export const DIAG_MASKS: Bitboard[64]; // main diagonal through each square
export const ANTI_DIAG_MASKS: Bitboard[64]; // anti-diagonal through each square
```

Precompute at module load — eliminates per-call math inside HQ.

---

## Phase 3 — attacks.ts

### 3.1 Precomputed tables

```typescript
export const KNIGHT_ATTACKS: Bitboard[] = new Array(64);
export const KING_ATTACKS: Bitboard[] = new Array(64);
export const PAWN_ATTACKS: [Bitboard[], Bitboard[]] = [new Array(64), new Array(64)];
// PAWN_ATTACKS[Color.White][sq], PAWN_ATTACKS[Color.Black][sq]
```

Knight attack per square `s` (b = sqBB(s)):

```typescript
KNIGHT_ATTACKS[s] = ((b << 17n) & NOT_FILE_A) | ((b << 15n) & NOT_FILE_H) | ((b << 10n) & NOT_FILE_AB) | ((b << 6n) & NOT_FILE_GH) | ((b >> 17n) & NOT_FILE_H) | ((b >> 15n) & NOT_FILE_A) | ((b >> 10n) & NOT_FILE_GH) | ((b >> 6n) & NOT_FILE_AB);
```

Pawn attacks:

```typescript
PAWN_ATTACKS[Color.White][s] = ((b << 9n) & NOT_FILE_A) | ((b << 7n) & NOT_FILE_H);
PAWN_ATTACKS[Color.Black][s] = ((b >> 9n) & NOT_FILE_H) | ((b >> 7n) & NOT_FILE_A);
```

King attacks: 8 adjacent squares, clipped to board edge.

### 3.2 Sliding attacks — Dumb7Fill (o^(o-2r) classical fill)

Avoid `reverseBits` entirely — it's the #1 bottleneck (called twice per ray in HQ). Use **Dumb7Fill** instead: 6 shifts and masks per direction, no reversal, no loop:

```typescript
function fillNorth(gen: Bitboard, occ: Bitboard): Bitboard {
  const empty = ~occ & BB_FULL;
  gen |= (gen << 8n) & empty;
  gen |= (gen << 8n) & empty;
  gen |= (gen << 8n) & empty;
  gen |= (gen << 8n) & empty;
  gen |= (gen << 8n) & empty;
  gen |= (gen << 8n) & empty;
  return (gen << 8n) & BB_FULL;
}
function fillSouth(gen: Bitboard, occ: Bitboard): Bitboard {
  const empty = ~occ & BB_FULL;
  gen |= (gen >> 8n) & empty;
  gen |= (gen >> 8n) & empty;
  gen |= (gen >> 8n) & empty;
  gen |= (gen >> 8n) & empty;
  gen |= (gen >> 8n) & empty;
  gen |= (gen >> 8n) & empty;
  return gen >> 8n;
}
// fillEast/West/NE/NW/SE/SW — same pattern with wrap guards (& NOT_FILE_A etc.)

export function rookAttacks(sq: Square, occ: Bitboard): Bitboard {
  const b = sqBB(sq);
  return fillNorth(b, occ) | fillSouth(b, occ) | fillEast(b, occ) | fillWest(b, occ);
}

export function bishopAttacks(sq: Square, occ: Bitboard): Bitboard {
  const b = sqBB(sq);
  return fillNE(b, occ) | fillNW(b, occ) | fillSE(b, occ) | fillSW(b, occ);
}

export function queenAttacks(sq: Square, occ: Bitboard): Bitboard {
  return rookAttacks(sq, occ) | bishopAttacks(sq, occ);
}
```

### 3.3 `isAttacked(sq, byColor, board, allOcc)`

Accept a pre-computed `allOcc: Bitboard` parameter — callers (especially legal filtering) reuse the same value across many calls rather than recomputing `occupied[0] | occupied[1]` each time.

Check in order cheapest-first (optimizes for the common "not attacked" early exit):

1. Knights: `KNIGHT_ATTACKS[sq] & board.pieces[byColor][Piece.Knight]`
2. Pawns: `PAWN_ATTACKS[opponent(byColor)][sq] & board.pieces[byColor][Piece.Pawn]`
3. King: `KING_ATTACKS[sq] & board.pieces[byColor][Piece.King]`
4. Bishops/Queen: `bishopAttacks(sq, allOcc) & (bishops | queens)`
5. Rooks/Queen: `rookAttacks(sq, allOcc) & (rooks | queens)`

---

## Phase 4 — board.ts

### State

```typescript
// pieces[color][pieceType] — 12 bitboards
pieces:    [Bitboard[], Bitboard[]]   // pieces[Color][Piece]
occupied:  [Bitboard, Bitboard]       // per-color occupancy (derived, kept in sync)
turn:      Color
castling:  number   // bitmask: bit0=wK, bit1=wQ, bit2=bK, bit3=bQ
enPassant: Square | -1                // -1 = no en passant square
halfmove:  number
fullmove:  number
history:   HistoryEntry[]
hashLo:    number   // Zobrist hash low 32 bits (native number, no heap alloc)
hashHi:    number   // Zobrist hash high 32 bits
```

Using a `number` bitmask for `castling` (instead of 4 booleans) makes snapshotting trivial and enables fast XOR-based incremental Zobrist updates for castling rights.

```typescript
const CastleFlag = { WK: 1, WQ: 2, BK: 4, BQ: 8 } as const;
```

### HistoryEntry (everything needed to unmake)

```typescript
interface HistoryEntry {
  move: Move; // the move that was made
  castling: number; // castling bitmask before the move
  enPassant: Square | -1;
  halfmove: number;
  hashLo: number; // Zobrist hash low 32 bits before the move
  hashHi: number; // Zobrist hash high 32 bits before the move
}
```

### makeMove — XOR-based, no allocation

```typescript
makeMove(move: Move): void {
  // 1. Save snapshot to history
  // 2. XOR piece off `from`, onto `to` in pieces[color][piece] and occupied[color]
  // 3. Capture: clear pieces[opp][captured] & occupied[opp] at `to`
  // 4. En passant: clear pawn at ep capture square (to + 8 or to - 8)
  // 5. Promotion: remove pawn bit at `to`, set promoted piece bit at `to`
  // 6. Castling: move rook via XOR (pairs: wK: 7↔5, wQ: 0↔3, bK: 63↔61, bQ: 56↔59)
  // 7. Update enPassant (DoublePush sets it; all else clears)
  // 8. Update castling flags (rook/king moves clear the relevant bits)
  // 9. Update halfmove / fullmove / turn
  // 10. Incrementally update Zobrist hash
}
```

Castling rights update — clear flags when rooks or kings move:

```typescript
const CASTLING_MASK: number[] = new Array(64).fill(0b1111);
CASTLING_MASK[0] &= ~CastleFlag.WQ; // a1 rook moves
CASTLING_MASK[7] &= ~CastleFlag.WK; // h1 rook moves
CASTLING_MASK[4] &= ~(CastleFlag.WK | CastleFlag.WQ); // white king
CASTLING_MASK[56] &= ~CastleFlag.BQ;
CASTLING_MASK[63] &= ~CastleFlag.BK;
CASTLING_MASK[60] &= ~(CastleFlag.BK | CastleFlag.BQ);
// On each move: castling &= CASTLING_MASK[from] & CASTLING_MASK[to]
```

### Zobrist hashing

Store as two 32-bit `number`s — `bigint` XOR allocates on the heap in V8. All 64-bit precision, zero allocation:

```typescript
// ZOBRIST_PIECE_LO[color][piece][square] — 12×64 number (low 32 bits)
// ZOBRIST_PIECE_HI[color][piece][square] — 12×64 number (high 32 bits)
// ZOBRIST_CASTLING_LO[16] / _HI[16]
// ZOBRIST_EP_LO[8] / _HI[8]
// ZOBRIST_SIDE_LO / ZOBRIST_SIDE_HI

// Instead of: hash ^= ZOBRIST_PIECE[c][p][sq]
hashLo ^= ZOBRIST_PIECE_LO[c][p][sq];
hashHi ^= ZOBRIST_PIECE_HI[c][p][sq];

// Transposition table key: only combine when storing/probing
// (hashHi * 2**32 + hashLo) — compute once, not incrementally
```

Hard-code constants (or use `crypto.getRandomValues` once at startup) so hashes are deterministic across sessions.

### allOccupied / pieceAt

```typescript
allOccupied(): Bitboard { return this.occupied[0] | this.occupied[1] }

// O(1) via bitboard scan — check each of 12 BBs for the square's bit
pieceAt(sq: Square): { piece: Piece; color: Color } | null
```

---

## Phase 5 — movegen.ts

### LSB iteration helper

Use the `Math.clz32` + lo/hi split — avoids bigint loops entirely:

```typescript
function lsb(bb: Bitboard): Square {
  const lo = Number(bb & 0xffffffffn);
  if (lo) return 31 - Math.clz32(lo & -lo);
  const hi = Number((bb >> 32n) & 0xffffffffn);
  return 32 + 31 - Math.clz32(hi & -hi);
}
function popLSB(bb: Bitboard): [Square, Bitboard] {
  return [lsb(bb), bb & (bb - 1n)];
}
```

Do not use De Bruijn on `bigint` — it's slower than the clz32 split.

### Move pool — pre-allocated, reused across calls

```typescript
const MOVE_POOL = new Array<Move>(256); // worst-case legal move count
let moveCount = 0;
```

For the bot's search, use a pre-allocated `Int32Array(256)` of packed moves — avoids GC pressure entirely. `encodeMove`/`decodeMove` are the primary path in search; `Move` objects are only for the UI layer.

### Pseudo-legal generation

```typescript
function generatePseudoLegal(b: ChessBoard, moves: Move[]): void;
// Appends into pre-allocated MOVE_POOL starting at moveCount
```

Per piece type — iterate occupied squares via `popLSB` loop:

- **Pawns**: single/double push via shift + empty squares; captures via PAWN_ATTACKS & enemy; en passant; generate 4 separate moves per promotion (Queen/Rook/Bishop/Knight)
- **Knights/King**: lookup table & ~friendlyOccupied; iterate targets via popLSB
- **Bishops/Rooks/Queens**: sliding attacks & ~friendlyOccupied; iterate targets via popLSB
- **Castling** (checked in a separate pass — requires isAttacked on intermediate squares)

### Legal move filtering

```typescript
function generateLegal(b: ChessBoard): Move[];
```

Compute `allOcc = allOccupied()` once and pass it through all `isAttacked` calls — avoids recomputing the OR of 2 bitboards for every pseudo-legal move.

**Pin detection** (optimization): compute the set of absolutely pinned pieces once per `generateLegal` call. Pinned pieces can only move along their pin ray — skip `makeMove`/`unmakeMove` for them.

**Check evasion** (optimization): if `isAttacked(kingSquare, opp, allOcc)`, generate only king moves + captures of the checking piece + blocking interpositions. Cuts move generation ~80% in check positions.

For each remaining pseudo-legal move: `makeMove` → check `isAttacked(kingSquare, opp, allOcc)` → `unmakeMove`.

### From-square query

```typescript
function legalMovesFrom(b: ChessBoard, sq: Square): Move[];
// Filter generateLegal to move.from === sq
```

---

## Phase 6 — fen.ts

```typescript
interface FenState {
  pieces: [Bitboard[], Bitboard[]];
  turn: Color;
  castling: number; // CastleFlag bitmask
  enPassant: Square | -1;
  halfmove: number;
  fullmove: number;
}

export function parseFen(fen: string): FenState;
export function serializeFen(b: ChessBoard): string;
```

FEN rank ordering: rank 8 (index 56–63) first, rank 1 (0–7) last.
Piece char → `(Color, Piece)` mapping: `'P'→(White,Pawn)`, `'p'→(Black,Pawn)`, etc.
En passant field: parse file letter + rank → compute square index.

---

## Phase 7 — san.ts

SAN is **lazy** — do not compute it for every move in `generateLegal`. Only compute when a move is actually played (UI path) or `moves({ verbose: true })` is called. Store `san: ""` in engine-internal `Move`; fill it only in the adapter layer. This avoids string allocation in the bot's search.

```typescript
export function toSan(move: Move, board: ChessBoard, legal: Move[]): string;
```

Build SAN string:

1. Castling → `"O-O"` or `"O-O-O"`
2. Pawn moves → `"e4"`, `"exd5"`, `"e8=Q"` (file prefix only on captures)
3. Piece moves → piece char + optional disambiguation + target square + `"x"` if capture
4. Disambiguation: collect all legal moves of same piece type that target same `to` square;
   add file letter if files differ, rank digit if files match, both if neither
5. Append `"+"` or `"#"` based on `isAttacked(kingSquare)` and `generateLegal().length === 0`
   after making the move

Piece char lookup: `[' ','N','B','R','Q','K'][piece]` (pawn = space, handled separately).

---

## Phase 8 — chess.ts (engine façade)

Numeric API — no string types except `san` and FEN strings.

```typescript
export class ChessEngine {
  private b: ChessBoard;
  private hashCounts: Map<string, number>; // for threefold — key: hashHi.toString(16)+hashLo.toString(16)

  constructor(fen?: string);
  load(fen: string): void;
  reset(): void;
  fen(): string;
  turn(): Color; // 0 or 1
  legalMoves(): Move[];
  legalMovesFrom(sq: Square): Move[];
  makeMove(move: Move): void;
  unmakeMove(): void;
  isCheck(): boolean;
  isCheckmate(): boolean;
  isDraw(): boolean;
  isStalemate(): boolean;
  isThreefoldRepetition(): boolean;
  isInsufficientMaterial(): boolean;
  pieceAt(sq: Square): { piece: Piece; color: Color } | null;
  zobristHash(): bigint;
}
```

---

## Phase 9 — adapter.ts (chess.js compatibility)

Thin wrapper — converts string types ↔ numeric types. No logic lives here.

```typescript
// String type aliases (chess.js compatible)
export type ChessColor      = "w" | "b"
export type ChessSquare     = "a1" | ... | "h8"
export type ChessPieceSymbol = "p" | "n" | "b" | "r" | "q" | "k"
export interface ChessPiece { type: ChessPieceSymbol; color: ChessColor }
export interface ChessMove {
  from: ChessSquare; to: ChessSquare
  piece: ChessPieceSymbol; color: ChessColor
  captured?: ChessPieceSymbol; promotion?: ChessPieceSymbol
  flags: string; san: string
}
export const SQUARES: ChessSquare[]   // ["a8","b8",...,"h1"]

// Conversion helpers (zero-logic, just table lookups)
function colorToStr(c: Color): ChessColor
function strToColor(s: ChessColor): Color
function pieceToStr(p: Piece): ChessPieceSymbol
function strToPiece(s: ChessPieceSymbol): Piece
function sqToStr(s: Square): ChessSquare        // SQ_NAMES[s]
function strToSq(s: ChessSquare): Square        // SQ_INDEX[s]
function moveToChess(m: Move): ChessMove        // convert flags number → flags string
function chessToMoveInput(m: {from, to, promotion?}): {from: Square, to: Square, promotion: Piece}

export class Chess {
  private engine: ChessEngine
  private sanHistory: string[]

  constructor(fen?: string)
  load(fen: string): void
  reset(): void
  fen(): string
  turn(): ChessColor
  board(): (ChessPiece | null)[][]   // board[0]=rank8, board[7]=rank1
  moves(opts?: { square?: ChessSquare; verbose: true }): ChessMove[]
  move(input: { from: ChessSquare; to: ChessSquare; promotion?: ChessPieceSymbol }): ChessMove
  undo(): ChessMove | undefined
  isCheck(): boolean
  isCheckmate(): boolean
  isDraw(): boolean
  isGameOver(): boolean
  isStalemate(): boolean
  isThreefoldRepetition(): boolean
  isInsufficientMaterial(): boolean
  squareColor(sq: ChessSquare): "light" | "dark"   // (file+rank) % 2
  history(): string[]
}
```

**flags string** for ChessMove (used by existing app):

- `Normal` → `"n"`, `Capture` → `"c"`, `DoublePush` → `"b"`, `EnPassant` → `"e"`
- `CastleKing` → `"k"`, `CastleQueen` → `"q"`, `Promotion` → `"p"`, `Capture+Promotion` → `"cp"`

---

## Phase 10 — index.ts

```typescript
export { Chess, SQUARES } from "./adapter";
export type { ChessColor as Color, ChessSquare as Square, ChessPieceSymbol as PieceSymbol, ChessPiece as Piece, ChessMove as Move } from "./adapter";
export { ChessEngine } from "./chess";
export { Piece, Color, MoveFlags } from "./types";
```

---

## Phase 11 — Swap imports

All 13 files replace `from "chess.js"` with `from "../chess"` (or path alias).
No other changes — the adapter preserves the existing string API exactly.
Remove `chess.js` from `package.json` after verifying no remaining imports.

---

## Implementation Order

1. `types.ts` — Piece, Color, Square, MoveFlags, Move, Bitboard
2. `constants.ts` — sqBB, fileOf, rankOf, all masks, SQ_NAMES, SQ_INDEX
3. `attacks.ts` — precomputed tables, Dumb7Fill sliding, isAttacked
4. `board.ts` — ChessBoard (12 BBs, makeMove, unmakeMove, Zobrist)
5. `fen.ts` — parseFen, serializeFen
6. `movegen.ts` — generatePseudoLegal, generateLegal, legalMovesFrom
   6b. `perft.ts` — `perft(depth): number` returning node count; validate against known positions before proceeding. Startpos depth 5 = 4,865,609 nodes — catches ~95% of move gen bugs. **Do not proceed to step 7 until perft passes.**
7. `san.ts` — toSan (lazy, adapter-layer only)
8. `chess.ts` — ChessEngine façade
9. `adapter.ts` — Chess class + string type conversions
10. `index.ts` — barrel exports
11. Swap imports in all 13 app files

---

## Edge Cases

- **En passant discovery check**: removing the ep pawn reveals a check — caught by legality filter
- **Castling through/into check**: `isAttacked` on king's path squares (e1/f1/g1 for O-O)
- **Promotion + check**: SAN suffix added after making the move and testing check
- **Disambiguation**: two pieces of same type reaching same square — file/rank/both
- **50-move rule**: `halfmove >= 100` contributes to `isDraw()`
- **Zobrist correctness**: hash must include ep file and castling bitmask, not just pieces
- **Threefold on unmake**: decrement hash count (not just track forward)
- **Insufficient material**: K vs K, K+B vs K, K+N vs K, K+B vs K+B (same-color bishops), K+B vs K+B (opposite-color bishops = draw), K+N+N vs K (draw)
- **Diagonal/anti-diagonal mask generation**: compute via loop — common source of off-by-one bugs, validate carefully
- **Zobrist two-part key**: when probing/storing the transposition table, combine `hashLo`/`hashHi` into a single key only at that point; never store `bigint` in the TT
