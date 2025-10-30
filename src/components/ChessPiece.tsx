interface ChessPieceProps {
  type: "p" | "n" | "b" | "r" | "q" | "k";
  color: "w" | "b";
}

export const ChessPiece = ({ type, color }: ChessPieceProps) => {
  const piece = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
  return (
    <div class="transition-all duration-300 ease-out">
      <svg
        class="drop-shadow-2xl"
        classList={{ "fill-white drop-shadow-black/50": color === "w", "fill-black drop-shadow-white/50": color === "b" }}
        height={48}
        width={48}
      >
        <use href={`./chess.svg#${piece[type]}`} />
      </svg>
    </div>
  );
};
