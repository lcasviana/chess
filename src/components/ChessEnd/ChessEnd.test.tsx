import { render, screen } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockStore } from "~/test-utils/mockChessContext";

import { ChessEnd } from "./ChessEnd";

let mockStore = createMockStore();

vi.mock("~/contexts/ChessContext", () => ({
  useChess: () => mockStore,
}));

beforeEach(() => {
  mockStore = createMockStore();
});

function setGameOver() {
  mockStore.isGameOver = () => true;
}

describe("ChessEnd", () => {
  it("renders nothing when game is not over", () => {
    const { container } = render(() => <ChessEnd />);
    expect(container.firstChild).toBeNull();
  });

  it("renders dialog when game is over", () => {
    setGameOver();
    render(() => <ChessEnd />);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("dialog has aria-modal=true", () => {
    setGameOver();
    render(() => <ChessEnd />);
    expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("true");
  });

  it("shows checkmate message when player wins", () => {
    setGameOver();
    mockStore.isCheckmate = () => true;
    mockStore.turn = () => "b";
    mockStore.player = () => "w";
    render(() => <ChessEnd />);
    expect(screen.getByText("Checkmate! White Wins!")).toBeTruthy();
  });

  it("shows checkmate message when player loses", () => {
    setGameOver();
    mockStore.isCheckmate = () => true;
    mockStore.turn = () => "w";
    mockStore.player = () => "w";
    render(() => <ChessEnd />);
    expect(screen.getByText("Checkmate! Black Wins!")).toBeTruthy();
  });

  it("shows stalemate message", () => {
    setGameOver();
    mockStore.isStalemate = () => true;
    render(() => <ChessEnd />);
    expect(screen.getByText("Stalemate!")).toBeTruthy();
  });

  it("shows draw by threefold repetition message", () => {
    setGameOver();
    mockStore.isThreefoldRepetition = () => true;
    render(() => <ChessEnd />);
    expect(screen.getByText("Draw by Threefold Repetition!")).toBeTruthy();
  });

  it("shows draw by insufficient material message", () => {
    setGameOver();
    mockStore.isInsufficientMaterial = () => true;
    render(() => <ChessEnd />);
    expect(screen.getByText("Draw by Insufficient Material!")).toBeTruthy();
  });

  it("shows generic draw message", () => {
    setGameOver();
    render(() => <ChessEnd />);
    expect(screen.getByText("Draw!")).toBeTruthy();
  });

  it("calls resetGame when Play Again is clicked", () => {
    const resetGame = vi.fn();
    setGameOver();
    mockStore.resetGame = resetGame;
    render(() => <ChessEnd />);
    screen.getByText("Play Again").click();
    expect(resetGame).toHaveBeenCalledTimes(1);
  });
});
