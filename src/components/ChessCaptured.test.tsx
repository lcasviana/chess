import { render, screen } from "@solidjs/testing-library";

import { createMockStore } from "~/test-utils/mockChessContext";

import { ChessCaptured } from "./ChessCaptured";
import { beforeEach, describe, expect, it, mock } from "bun:test";

let mockStore = createMockStore();

mock.module("~/contexts/ChessContext", () => ({
  useChess: () => mockStore,
}));

beforeEach(() => {
  mockStore = createMockStore();
});

describe("ChessCaptured", () => {
  it("renders without captured pieces", () => {
    const { container } = render(() => <ChessCaptured />);
    expect(container.firstElementChild).toBeTruthy();
  });

  it("does not show score when no pieces are captured", () => {
    render(() => <ChessCaptured />);
    expect(screen.queryByText(/^\+/)).not.toBeTruthy();
  });

  it("shows material advantage when white captured a black queen", () => {
    mockStore.capturedPieces = () => [{ id: "p1", color: "b", type: "q" }];
    mockStore.player = () => "w";
    render(() => <ChessCaptured />);
    expect(screen.getByText("+9")).toBeTruthy();
  });

  it("shows score when black captured a white rook", () => {
    mockStore.capturedPieces = () => [{ id: "p1", color: "w", type: "r" }];
    mockStore.player = () => "w";
    render(() => <ChessCaptured />);
    expect(screen.getByText("+5")).toBeTruthy();
  });

  it("hides score when material is equal", () => {
    mockStore.capturedPieces = () => [
      { id: "p1", color: "b", type: "p" },
      { id: "p2", color: "w", type: "p" },
    ];
    render(() => <ChessCaptured />);
    expect(screen.queryByText(/^\+/)).not.toBeTruthy();
  });

  it("renders captured pieces as svg images", () => {
    mockStore.capturedPieces = () => [
      { id: "p1", color: "b", type: "n" },
      { id: "p2", color: "b", type: "b" },
    ];
    const { container } = render(() => <ChessCaptured />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it("applies -scale-x-100 to container when flip is true", () => {
    mockStore.flip = () => true;
    const { container } = render(() => <ChessCaptured />);
    expect(container.firstElementChild?.className).toContain("-scale-x-100");
  });

  it("does not apply -scale-x-100 when flip is false", () => {
    mockStore.flip = () => false;
    const { container } = render(() => <ChessCaptured />);
    expect(container.firstElementChild?.className).not.toContain("-scale-x-100");
  });
});
