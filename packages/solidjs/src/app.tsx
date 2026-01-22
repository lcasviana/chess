import type { Component, JSX } from "solid-js";

import { ChessGame } from "./components/ChessGame";

import "./app.css";

const App: Component = (): JSX.Element => {
  return (
    <main class="grid size-full grid-rows-[auto_1fr_auto] justify-center gap-4 overflow-auto p-4">
      <h1 class="z-20 flex basis-full justify-center gap-6 text-5xl font-black">Chess</h1>
      <ChessGame />
      <footer class="z-20 flex basis-full items-end justify-center p-4 text-sm text-neutral-400">
        <span class="whitespace-nowrap">
          Made by{" "}
          <a href="https://github.com/lcasviana" target="_blank" class="text-neutral-50 underline">
            Lucas Viana
          </a>
        </span>
      </footer>
    </main>
  );
};

export default App;
