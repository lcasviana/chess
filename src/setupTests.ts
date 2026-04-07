import { configure } from "@testing-library/dom";

configure({
  getElementError(message) {
    const err = new Error(message?.split("\n")[0] ?? message ?? "");
    err.name = "TestingLibraryElementError";
    return err;
  },
});
