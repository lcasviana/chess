import type { Context, JSX, ParentComponent } from "solid-js";
import { createContext, useContext } from "solid-js";

import type { ChessStore } from "~/stores/chess.store";
import { chessStore } from "~/stores/chess.store";

const ChessContext: Context<ChessStore | undefined> = createContext<ChessStore>();

export const ChessProvider: ParentComponent = (props: { children?: JSX.Element }): JSX.Element => {
  const store: ChessStore = chessStore();
  return <ChessContext.Provider value={store}>{props.children}</ChessContext.Provider>;
};

export function useChess(): ChessStore {
  const context: ChessStore | undefined = useContext(ChessContext);
  if (!context) throw new Error("useChess must be used within a ChessProvider");
  return context;
}
