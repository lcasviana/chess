import type { Chess } from "chess.js";

export interface OpeningMove {
  move: string;
  weight: number;
}

type OpeningBookEntry = {
  name: string;
  variation?: string;
  moves?: OpeningMove[];
};

export const OPENING_BOOK: Readonly<Record<string, OpeningBookEntry>> = Object.freeze({
  "": {
    name: "Starting Position",
    moves: [
      { move: "e4", weight: 40 },
      { move: "d4", weight: 35 },
      { move: "Nf3", weight: 15 },
      { move: "c4", weight: 10 },
    ],
  },
  "e4": {
    name: "King's Pawn Opening",
    moves: [
      { move: "e5", weight: 50 },
      { move: "c5", weight: 30 },
      { move: "e6", weight: 10 },
      { move: "c6", weight: 5 },
      { move: "d5", weight: 5 },
    ],
  },
  "e4,e5": {
    name: "King's Pawn Game",
    moves: [
      { move: "Nf3", weight: 60 },
      { move: "Bc4", weight: 20 },
      { move: "Nc3", weight: 10 },
      { move: "f4", weight: 10 },
    ],
  },
  "e4,e5,Nf3": {
    name: "King's Knight Opening",
    moves: [
      { move: "Nc6", weight: 60 },
      { move: "Nf6", weight: 30 },
      { move: "d6", weight: 10 },
    ],
  },
  "e4,e5,Nf3,Nc6": {
    name: "King's Knight Opening",
    moves: [
      { move: "Bc4", weight: 45 },
      { move: "Bb5", weight: 45 },
      { move: "d4", weight: 10 },
    ],
  },
  "e4,e5,Nf3,Nc6,Bc4": {
    name: "Italian Game",
    moves: [
      { move: "Bc5", weight: 50 },
      { move: "Nf6", weight: 30 },
      { move: "Be7", weight: 20 },
    ],
  },
  "e4,e5,Nf3,Nc6,Bc4,Bc5": {
    name: "Italian Game",
    variation: "Giuoco Piano",
    moves: [
      { move: "c3", weight: 50 },
      { move: "d3", weight: 30 },
      { move: "Nc3", weight: 20 },
    ],
  },
  "e4,e5,Nf3,Nc6,Bc4,Bc5,c3": {
    name: "Italian Game",
    variation: "Giuoco Piano Main Line",
  },
  "e4,e5,Nf3,Nc6,Bc4,Bc5,d3": {
    name: "Italian Game",
    variation: "Giuoco Pianissimo",
  },
  "e4,e5,Nf3,Nc6,Bc4,Nf6": {
    name: "Italian Game",
    variation: "Two Knights Defense",
  },
  "e4,e5,Nf3,Nc6,Bc4,Be7": {
    name: "Italian Game",
    variation: "Hungarian Defense",
  },
  "e4,e5,Nf3,Nc6,Bb5": {
    name: "Ruy Lopez",
    moves: [
      { move: "a6", weight: 70 },
      { move: "Nf6", weight: 20 },
      { move: "d6", weight: 10 },
    ],
  },
  "e4,e5,Nf3,Nc6,Bb5,a6": {
    name: "Ruy Lopez",
    variation: "Morphy Defense",
    moves: [
      { move: "Ba4", weight: 80 },
      { move: "Bxc6", weight: 20 },
    ],
  },
  "e4,e5,Nf3,Nc6,Bb5,a6,Ba4": {
    name: "Ruy Lopez",
    variation: "Morphy Defense Main Line",
  },
  "e4,e5,Nf3,Nc6,Bb5,a6,Bxc6": {
    name: "Ruy Lopez",
    variation: "Exchange Variation",
  },
  "e4,e5,Nf3,Nc6,Bb5,Nf6": {
    name: "Ruy Lopez",
    variation: "Berlin Defense",
  },
  "e4,e5,Nf3,Nc6,Bb5,d6": {
    name: "Ruy Lopez",
    variation: "Steinitz Defense",
  },
  "e4,e5,Nf3,Nc6,d4": {
    name: "Scotch Game",
  },
  "e4,e5,Nf3,Nf6": {
    name: "Petrov's Defense",
  },
  "e4,e5,Nf3,d6": {
    name: "Philidor Defense",
  },
  "e4,e5,Bc4": {
    name: "Bishop's Opening",
  },
  "e4,e5,Nc3": {
    name: "Vienna Game",
  },
  "e4,e5,f4": {
    name: "King's Gambit",
  },
  "e4,c5": {
    name: "Sicilian Defense",
    moves: [
      { move: "Nf3", weight: 70 },
      { move: "Nc3", weight: 20 },
      { move: "c3", weight: 10 },
    ],
  },
  "e4,c5,Nf3": {
    name: "Sicilian Defense",
    variation: "Open Sicilian",
    moves: [
      { move: "d6", weight: 40 },
      { move: "Nc6", weight: 35 },
      { move: "e6", weight: 15 },
      { move: "g6", weight: 10 },
    ],
  },
  "e4,c5,Nf3,d6": {
    name: "Sicilian Defense",
    variation: "Najdorf/Dragon Setup",
    moves: [
      { move: "d4", weight: 90 },
      { move: "Bb5+", weight: 10 },
    ],
  },
  "e4,c5,Nf3,d6,d4": {
    name: "Sicilian Defense",
    variation: "Open Sicilian",
    moves: [{ move: "cxd4", weight: 100 }],
  },
  "e4,c5,Nf3,d6,d4,cxd4": {
    name: "Sicilian Defense",
    variation: "Open Sicilian",
    moves: [{ move: "Nxd4", weight: 100 }],
  },
  "e4,c5,Nf3,d6,d4,cxd4,Nxd4": {
    name: "Sicilian Defense",
    variation: "Open Sicilian",
  },
  "e4,c5,Nf3,Nc6": {
    name: "Sicilian Defense",
    variation: "Old Sicilian",
  },
  "e4,c5,Nf3,e6": {
    name: "Sicilian Defense",
    variation: "Paulsen/Taimanov",
  },
  "e4,c5,Nf3,g6": {
    name: "Sicilian Defense",
    variation: "Hyperaccelerated Dragon",
  },
  "e4,c5,Nc3": {
    name: "Sicilian Defense",
    variation: "Closed Sicilian",
  },
  "e4,c5,c3": {
    name: "Sicilian Defense",
    variation: "Alapin Variation",
  },
  "e4,e6": {
    name: "French Defense",
    moves: [
      { move: "d4", weight: 80 },
      { move: "d3", weight: 10 },
      { move: "Nf3", weight: 10 },
    ],
  },
  "e4,e6,d4": {
    name: "French Defense",
    moves: [{ move: "d5", weight: 100 }],
  },
  "e4,e6,d4,d5": {
    name: "French Defense",
    moves: [
      { move: "Nc3", weight: 50 },
      { move: "Nd2", weight: 30 },
      { move: "e5", weight: 20 },
    ],
  },
  "e4,e6,d4,d5,Nc3": {
    name: "French Defense",
    variation: "Winawer/Classical",
  },
  "e4,e6,d4,d5,Nd2": {
    name: "French Defense",
    variation: "Tarrasch",
  },
  "e4,e6,d4,d5,e5": {
    name: "French Defense",
    variation: "Advance Variation",
  },
  "e4,e6,d3": {
    name: "French Defense",
    variation: "King's Indian Attack",
  },
  "e4,c6": {
    name: "Caro-Kann Defense",
    moves: [
      { move: "d4", weight: 80 },
      { move: "Nc3", weight: 15 },
      { move: "Nf3", weight: 5 },
    ],
  },
  "e4,c6,d4": {
    name: "Caro-Kann Defense",
    moves: [{ move: "d5", weight: 100 }],
  },
  "e4,c6,d4,d5": {
    name: "Caro-Kann Defense",
    moves: [
      { move: "Nc3", weight: 50 },
      { move: "Nd2", weight: 30 },
      { move: "e5", weight: 20 },
    ],
  },
  "e4,c6,d4,d5,Nc3": {
    name: "Caro-Kann Defense",
    variation: "Classical",
  },
  "e4,c6,d4,d5,Nd2": {
    name: "Caro-Kann Defense",
    variation: "Advance Variation",
  },
  "e4,c6,d4,d5,e5": {
    name: "Caro-Kann Defense",
    variation: "Advance Variation",
  },
  "e4,d5": {
    name: "Scandinavian Defense",
    moves: [{ move: "exd5", weight: 100 }],
  },
  "e4,d5,exd5": {
    name: "Scandinavian Defense",
    moves: [
      { move: "Qxd5", weight: 60 },
      { move: "Nf6", weight: 40 },
    ],
  },
  "e4,d5,exd5,Qxd5": {
    name: "Scandinavian Defense",
    variation: "Main Line",
    moves: [
      { move: "Nc3", weight: 80 },
      { move: "Nf3", weight: 20 },
    ],
  },
  "e4,d5,exd5,Qxd5,Nc3": {
    name: "Scandinavian Defense",
    variation: "Main Line",
  },
  "e4,d5,exd5,Nf6": {
    name: "Scandinavian Defense",
    variation: "Modern Variation",
  },
  "e4,d6": {
    name: "Pirc Defense",
    moves: [
      { move: "d4", weight: 80 },
      { move: "Nc3", weight: 15 },
      { move: "Nf3", weight: 5 },
    ],
  },
  "e4,d6,d4": {
    name: "Pirc Defense",
    moves: [
      { move: "Nf6", weight: 70 },
      { move: "g6", weight: 30 },
    ],
  },
  "e4,d6,d4,Nf6": {
    name: "Pirc Defense",
    moves: [
      { move: "Nc3", weight: 70 },
      { move: "Nf3", weight: 20 },
      { move: "f3", weight: 10 },
    ],
  },
  "e4,d6,d4,Nf6,Nc3": {
    name: "Pirc Defense",
    variation: "Classical",
  },
  "e4,d6,d4,Nf6,f3": {
    name: "Pirc Defense",
    variation: "Austrian Attack",
  },
  "e4,d6,d4,g6": {
    name: "Modern Defense",
  },
  "d4": {
    name: "Queen's Pawn Opening",
    moves: [
      { move: "d5", weight: 45 },
      { move: "Nf6", weight: 40 },
      { move: "e6", weight: 10 },
      { move: "f5", weight: 5 },
    ],
  },
  "d4,d5": {
    name: "Queen's Pawn Game",
    moves: [
      { move: "c4", weight: 70 },
      { move: "Nf3", weight: 20 },
      { move: "Bf4", weight: 10 },
    ],
  },
  "d4,d5,c4": {
    name: "Queen's Gambit",
    moves: [
      { move: "e6", weight: 50 },
      { move: "c6", weight: 30 },
      { move: "dxc4", weight: 15 },
      { move: "Nf6", weight: 5 },
    ],
  },
  "d4,d5,c4,e6": {
    name: "Queen's Gambit",
    variation: "Declined",
    moves: [
      { move: "Nc3", weight: 60 },
      { move: "Nf3", weight: 40 },
    ],
  },
  "d4,d5,c4,e6,Nc3": {
    name: "Queen's Gambit Declined",
    moves: [
      { move: "Nf6", weight: 80 },
      { move: "Be7", weight: 20 },
    ],
  },
  "d4,d5,c4,e6,Nc3,Nf6": {
    name: "Queen's Gambit Declined",
    variation: "Main Line",
  },
  "d4,d5,c4,c6": {
    name: "Slav Defense",
  },
  "d4,d5,c4,dxc4": {
    name: "Queen's Gambit",
    variation: "Accepted",
  },
  "d4,d5,Nf3": {
    name: "London System / Colle System",
  },
  "d4,d5,Bf4": {
    name: "London System",
  },
  "d4,Nf6": {
    name: "Indian Defense",
    moves: [
      { move: "c4", weight: 70 },
      { move: "Nf3", weight: 20 },
      { move: "Bg5", weight: 10 },
    ],
  },
  "d4,Nf6,c4": {
    name: "Indian Game",
    moves: [
      { move: "g6", weight: 40 },
      { move: "e6", weight: 35 },
      { move: "e5", weight: 15 },
      { move: "c5", weight: 10 },
    ],
  },
  "d4,Nf6,c4,g6": {
    name: "King's Indian Defense",
    moves: [
      { move: "Nc3", weight: 70 },
      { move: "Nf3", weight: 30 },
    ],
  },
  "d4,Nf6,c4,g6,Nc3": {
    name: "King's Indian Defense",
    moves: [
      { move: "Bg7", weight: 80 },
      { move: "d5", weight: 20 },
    ],
  },
  "d4,Nf6,c4,g6,Nc3,Bg7": {
    name: "King's Indian Defense",
    moves: [
      { move: "e4", weight: 60 },
      { move: "Nf3", weight: 40 },
    ],
  },
  "d4,Nf6,c4,g6,Nc3,Bg7,e4": {
    name: "King's Indian Defense",
    variation: "Classical",
  },
  "d4,Nf6,c4,g6,Nc3,d5": {
    name: "Grünfeld Defense",
  },
  "d4,Nf6,c4,e6": {
    name: "Nimzo-Indian / Queen's Indian",
  },
  "d4,Nf6,c4,e5": {
    name: "Budapest Gambit",
  },
  "d4,Nf6,c4,c5": {
    name: "Benoni Defense",
  },
  "d4,Nf6,Bg5": {
    name: "Trompowsky Attack",
  },
  "d4,f5": {
    name: "Dutch Defense",
  },
  "c4": {
    name: "English Opening",
    moves: [
      { move: "e5", weight: 40 },
      { move: "Nf6", weight: 30 },
      { move: "c5", weight: 15 },
      { move: "e6", weight: 15 },
    ],
  },
  "c4,e5": {
    name: "English Opening",
    variation: "Reversed Sicilian",
    moves: [
      { move: "Nc3", weight: 60 },
      { move: "g3", weight: 30 },
      { move: "Nf3", weight: 10 },
    ],
  },
  "c4,e5,Nc3": {
    name: "English Opening",
    variation: "Reversed Sicilian",
    moves: [
      { move: "Nf6", weight: 50 },
      { move: "Nc6", weight: 30 },
      { move: "Bb4", weight: 20 },
    ],
  },
  "c4,e5,Nc3,Nf6": {
    name: "English Opening",
    variation: "Four Knights",
  },
  "c4,e5,Nc3,Nc6": {
    name: "English Opening",
    variation: "Reversed Sicilian",
  },
  "c4,e5,Nc3,Bb4": {
    name: "English Opening",
    variation: "Four Knights",
  },
  "c4,c5": {
    name: "English Opening",
    variation: "Symmetrical",
  },
  "Nf3": {
    name: "Réti Opening",
    moves: [
      { move: "d5", weight: 40 },
      { move: "Nf6", weight: 35 },
      { move: "c5", weight: 15 },
      { move: "g6", weight: 10 },
    ],
  },
  "Nf3,d5": {
    name: "Réti Opening",
    moves: [
      { move: "c4", weight: 50 },
      { move: "g3", weight: 30 },
      { move: "d4", weight: 20 },
    ],
  },
  "Nf3,d5,c4": {
    name: "Réti Opening",
    variation: "Réti Gambit",
  },
  "Nf3,d5,g3": {
    name: "King's Indian Attack",
  },
});

export function getBookMove(chess: Chess): string | null {
  const entry = OPENING_BOOK[chess.history().join(",")];
  if (!entry?.moves?.length) return null;
  const total = entry.moves.reduce((s, m) => s + m.weight, 0);
  let r = Math.random() * total;
  for (const m of entry.moves) {
    r -= m.weight;
    if (r <= 0) return m.move;
  }
  return entry.moves[0].move;
}

export function isInBook(chess: Chess): boolean {
  return !!OPENING_BOOK[chess.history().join(",")]?.moves;
}

export function shouldUseBook(chess: Chess, maxDepth = 10): boolean {
  return chess.history().length < maxDepth && isInBook(chess);
}
