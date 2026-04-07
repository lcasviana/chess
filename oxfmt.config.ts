import { defineConfig } from "oxfmt";

export default defineConfig({
  htmlWhitespaceSensitivity: "strict",
  quoteProps: "consistent",
  sortImports: {
    groups: [["react", "solid"], "external", "internal", "import", "unknown"],
    customGroups: [
      { groupName: "react", elementNamePattern: ["react", "react-*"] },
      { groupName: "solid", elementNamePattern: ["solid-js", "@solidjs"] },
    ],
  },
  sortPackageJson: {
    sortScripts: false,
  },
  sortTailwindcss: {
    stylesheet: "./src/App.css",
    functions: ["clsx", "cn"],
    preserveWhitespace: true,
  },
});
