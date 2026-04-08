import { defineConfig } from "oxfmt";

export default defineConfig({
  htmlWhitespaceSensitivity: "strict",
  quoteProps: "consistent",
  sortImports: {
    groups: [["react", "solid", "vite"], "external", "builtin", "internal", ["index", "parent", "sibling", "subpath"], "style", "import", "unknown"],
    customGroups: [
      { groupName: "react", elementNamePattern: ["react", "react-*"] },
      { groupName: "solid", elementNamePattern: ["solid-js", "@solidjs", "@solidjs/*"] },
      { groupName: "vite", elementNamePattern: ["vite", "vite-*", "*/vite", "vitest", "vitest/*"] },
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
