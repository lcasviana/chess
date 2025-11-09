import type { Component, JSX } from "solid-js";

import { ChessProvider } from "~/contexts/ChessContext";

import { ChessBoard } from "./ChessBoard";
import { ChessCaptured } from "./ChessCaptured";
import { ChessStart } from "./ChessStart";

export const ChessGame: Component = (): JSX.Element => {
  return (
    <ChessProvider>
      <div class="relative grid size-full place-content-center place-items-center overflow-auto">
        <ChessStart />
        <ChessBoard />
        <ChessCaptured />
      </div>
    </ChessProvider>
  );
};
