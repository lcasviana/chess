import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import { ChessPiece } from "./ChessPiece";

describe("ChessPiece", () => {
  it("renders svg with correct use href for white pawn", () => {
    const { container } = render(() => <ChessPiece piece={() => ({ id: "wp1", color: "w", type: "p" })} selected={() => false} flip={() => false} />);
    const use = container.querySelector("use");
    expect(use?.getAttribute("href")).toBe("./chess.svg#p");
  });

  it("renders svg with correct use href for black queen", () => {
    const { container } = render(() => <ChessPiece piece={() => ({ id: "bq1", color: "b", type: "q" })} selected={() => false} flip={() => false} />);
    const use = container.querySelector("use");
    expect(use?.getAttribute("href")).toBe("./chess.svg#q");
  });

  it("sets aria-label to color and piece name", () => {
    render(() => <ChessPiece piece={() => ({ id: "wk1", color: "w", type: "k" })} selected={() => false} flip={() => false} />);
    expect(screen.getByRole("img", { name: "White King" })).toBeTruthy();
  });

  it("sets aria-label for black knight", () => {
    render(() => <ChessPiece piece={() => ({ id: "bn1", color: "b", type: "n" })} selected={() => false} flip={() => false} />);
    expect(screen.getByRole("img", { name: "Black Knight" })).toBeTruthy();
  });

  it("applies white fill class for white piece", () => {
    const { container } = render(() => <ChessPiece piece={() => ({ id: "wr1", color: "w", type: "r" })} selected={() => false} flip={() => false} />);
    const svg = container.querySelector("svg");
    expect(svg?.className).toContain("fill-zinc-300");
    expect(svg?.className).not.toContain("fill-zinc-900");
  });

  it("applies black fill class for black piece", () => {
    const { container } = render(() => <ChessPiece piece={() => ({ id: "bb1", color: "b", type: "b" })} selected={() => false} flip={() => false} />);
    const svg = container.querySelector("svg");
    expect(svg?.className).toContain("fill-zinc-900");
    expect(svg?.className).not.toContain("fill-zinc-300");
  });

  it("applies scale-125 when selected", () => {
    const { container } = render(() => <ChessPiece piece={() => ({ id: "wp2", color: "w", type: "p" })} selected={() => true} flip={() => false} />);
    expect(container.querySelector("svg")?.className).toContain("scale-125");
  });

  it("does not apply scale-125 when not selected", () => {
    const { container } = render(() => <ChessPiece piece={() => ({ id: "wp3", color: "w", type: "p" })} selected={() => false} flip={() => false} />);
    expect(container.querySelector("svg")?.className).not.toContain("scale-125");
  });

  it("applies rotate-180 when flip is true", () => {
    const { container } = render(() => <ChessPiece piece={() => ({ id: "wp4", color: "w", type: "p" })} selected={() => false} flip={() => true} />);
    expect(container.querySelector("svg")?.className).toContain("rotate-180");
  });

  it("does not apply rotate-180 when flip is false", () => {
    const { container } = render(() => <ChessPiece piece={() => ({ id: "wp5", color: "w", type: "p" })} selected={() => false} flip={() => false} />);
    expect(container.querySelector("svg")?.className).not.toContain("rotate-180");
  });

  it("sets view-transition-name style to piece id", () => {
    const { container } = render(() => (
      <ChessPiece piece={() => ({ id: "my-piece", color: "w", type: "q" })} selected={() => false} flip={() => false} />
    ));
    const svg = container.querySelector("svg");
    expect(svg?.style.viewTransitionName).toBe("my-piece");
  });

  it("sets svg id to piece id", () => {
    const { container } = render(() => (
      <ChessPiece piece={() => ({ id: "piece-id-123", color: "b", type: "r" })} selected={() => false} flip={() => false} />
    ));
    expect(container.querySelector("svg")?.id).toBe("piece-id-123");
  });
});
