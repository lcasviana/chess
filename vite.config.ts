import tailwindCss from "@tailwindcss/vite";
import solidJs from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solidJs(), tailwindCss()],
  resolve: { tsconfigPaths: true },
  server: { port: 3000 },
  build: { target: "esnext" },
  test: { reporters: ["dot"] },
});
