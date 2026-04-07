import { render } from "@solidjs/testing-library";

import { ChessCoordinates, files, ranks } from "./ChessCoordinates";
import { beforeEach, describe, expect, it } from "bun:test";

describe("ChessCoordinates", () => {
  describe("files type", () => {
    let container: HTMLElement;

    beforeEach(() => {
      ({ container } = render(() => <ChessCoordinates type="files" gridArea="1 / 2 / 2 / 10" flip={() => false} />));
    });

    it("renders 8 file labels", () => {
      expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(8);
    });

    it("renders all file letters a-h", () => {
      const labels = Array.from(container.querySelectorAll("[aria-hidden='true']")).map((el) => el.textContent);
      expect(labels).toEqual([...files]);
    });

    it("applies grid-cols-8 for files type", () => {
      expect(container.firstElementChild?.className).toContain("grid-cols-8");
    });
  });

  describe("ranks type", () => {
    let container: HTMLElement;

    beforeEach(() => {
      ({ container } = render(() => <ChessCoordinates type="ranks" gridArea="2 / 1 / 10 / 2" flip={() => false} />));
    });

    it("renders 8 rank labels", () => {
      expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(8);
    });

    it("renders ranks 8 down to 1", () => {
      const labels = Array.from(container.querySelectorAll("[aria-hidden='true']")).map((el) => el.textContent);
      expect(labels).toEqual(ranks.map(String));
    });

    it("applies grid-rows-8 for ranks type", () => {
      expect(container.firstElementChild?.className).toContain("grid-rows-8");
    });
  });

  describe("flip prop", () => {
    it("applies rotate-180 to each label when flip is true", () => {
      const { container } = render(() => <ChessCoordinates type="files" gridArea="1 / 2 / 2 / 10" flip={() => true} />);
      container.querySelectorAll("[aria-hidden='true']").forEach((label) => {
        expect(label.className).toContain("rotate-180");
      });
    });

    it("does not apply rotate-180 when flip is false", () => {
      const { container } = render(() => <ChessCoordinates type="files" gridArea="1 / 2 / 2 / 10" flip={() => false} />);
      container.querySelectorAll("[aria-hidden='true']").forEach((label) => {
        expect(label.className).not.toContain("rotate-180");
      });
    });
  });

  it("sets grid-area style from gridArea prop", () => {
    const { container } = render(() => <ChessCoordinates type="files" gridArea="3 / 4 / 5 / 6" flip={() => false} />);
    expect((container.firstElementChild as HTMLElement).style.gridArea).toBe("3 / 4 / 5 / 6");
  });

  it("all labels are aria-hidden", () => {
    const { container } = render(() => <ChessCoordinates type="ranks" gridArea="2 / 1 / 10 / 2" flip={() => false} />);
    expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(8);
  });
});
