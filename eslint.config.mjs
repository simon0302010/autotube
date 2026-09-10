import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import js from "@eslint/js";
import { defineConfig } from "eslint/config";

export default defineConfig({
  extends: [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettierConfig,
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
  },
});
