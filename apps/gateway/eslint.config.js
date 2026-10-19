import js from "@eslint/js"
import tseslint from "typescript-eslint"
import { defineConfig } from "eslint/config"
export default defineConfig(
  { ignores: ["dist", "build.mjs", "eslint.config.js"] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  { rules: { "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }], "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", ignoreRestSiblings: true }] } },
  { languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } } },
)
