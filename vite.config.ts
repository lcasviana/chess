import tailwindCss from "@tailwindcss/vite";
import solidJs from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solidJs(), tailwindCss()],
  resolve: { tsconfigPaths: true },
  server: {
    port: 3000,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  build: { target: "esnext" },
  test: { reporters: ["dot"] },
});
