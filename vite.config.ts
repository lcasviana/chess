import tailwindcss from "@tailwindcss/vite";
import solidPlugin from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solidPlugin(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  server: { port: 3000 },
  build: { target: "esnext" },
  test: {
    reporters: ["dot"],
    onConsoleLog: () => false,
    setupFiles: ["src/setupTests.ts"],
  },
});
