import type { Component, JSX } from "solid-js";

import { ChessProvider } from "~/contexts/ChessContext";

import { ChessBoard } from "../ChessBoard/ChessBoard";
import { ChessCaptured } from "../ChessCaptured/ChessCaptured";
import { ChessEnd } from "../ChessEnd/ChessEnd";
import { ChessStart } from "../ChessStart/ChessStart";

export const ChessGame: Component = (): JSX.Element => {
  return (
    <ChessProvider>
      <div class="relative grid size-full place-content-center place-items-center overflow-auto">
        <ChessStart />
        <ChessEnd />
        <ChessBoard />
        <ChessCaptured />
      </div>
    </ChessProvider>
  );
};
