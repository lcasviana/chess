import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import solid from "eslint-plugin-solid/configs/typescript";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  solid,
  prettier,
  { languageOptions: { parserOptions: { project: true, tsconfigRootDir: import.meta.dirname } } },
  { rules: { "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", fixStyle: "separate-type-imports" }] } },
  { ignores: [".vinxi/**", ".output/**", "node_modules/**"] },
);
