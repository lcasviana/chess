import { render, screen } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockStore } from "~/test-utils/mockChessContext";

import { ChessStart } from "./ChessStart";

let mockStore = createMockStore();

vi.mock("~/contexts/ChessContext", () => ({
  useChess: () => mockStore,
}));

beforeEach(() => {
  mockStore = createMockStore();
});

describe("ChessStart", () => {
  it("renders nothing when game has started", () => {
    mockStore.gameStarted = () => true;
    const { container } = render(() => <ChessStart />);
    expect(container.firstChild).toBeNull();
  });

  it("renders dialog when game has not started", () => {
    render(() => <ChessStart />);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("dialog has aria-modal=true", () => {
    render(() => <ChessStart />);
    expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("true");
  });

  it("shows title 'Choose Your Color'", () => {
    render(() => <ChessStart />);
    expect(screen.getByText("Choose Your Color")).toBeTruthy();
  });

  it("renders white and black radio options", () => {
    render(() => <ChessStart />);
    const radios = screen.getAllByRole("radio", { hidden: true });
    expect(radios).toHaveLength(2);
    const values = (radios as HTMLInputElement[]).map((r) => r.value);
    expect(values).toContain("w");
    expect(values).toContain("b");
  });

  it("white radio is checked when player is white", () => {
    const { container } = render(() => <ChessStart />);
    const whiteRadio = container.querySelector('input[value="w"]') as HTMLInputElement;
    expect(whiteRadio.checked).toBe(true);
  });

  it("black radio is checked when player is black", () => {
    mockStore.player = () => "b";
    const { container } = render(() => <ChessStart />);
    const blackRadio = container.querySelector('input[value="b"]') as HTMLInputElement;
    expect(blackRadio.checked).toBe(true);
  });

  it("calls setPlayer with 'w' when white radio changes", () => {
    const setPlayer = vi.fn();
    mockStore.player = () => "b";
    mockStore.setPlayer = setPlayer;
    const { container } = render(() => <ChessStart />);
    const whiteRadio = container.querySelector('input[value="w"]') as HTMLInputElement;
    whiteRadio.dispatchEvent(new Event("change"));
    expect(setPlayer).toHaveBeenCalledWith("w");
  });

  it("calls setPlayer with 'b' when black radio changes", () => {
    const setPlayer = vi.fn();
    mockStore.setPlayer = setPlayer;
    const { container } = render(() => <ChessStart />);
    const blackRadio = container.querySelector('input[value="b"]') as HTMLInputElement;
    blackRadio.dispatchEvent(new Event("change"));
    expect(setPlayer).toHaveBeenCalledWith("b");
  });

  it("calls onGameStart when form is submitted", () => {
    const onGameStart = vi.fn();
    mockStore.onGameStart = onGameStart;
    const { container } = render(() => <ChessStart />);
    const form = container.querySelector("form") as HTMLFormElement;
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(onGameStart).toHaveBeenCalledTimes(1);
  });

  it("start button label includes player color", () => {
    render(() => <ChessStart />);
    expect(screen.getByRole("button", { name: "Start Game As White" })).toBeTruthy();
  });

  it("start button label reflects black player", () => {
    mockStore.player = () => "b";
    render(() => <ChessStart />);
    expect(screen.getByRole("button", { name: "Start Game As Black" })).toBeTruthy();
  });
});
