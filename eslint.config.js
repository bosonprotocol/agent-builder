// eslint.config.js
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";
import { resolve } from "node:path";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";

const project = resolve(process.cwd(), "./tsconfig.eslint.json");

export default [
  {
    ignores: [
      ".*.js",
      ".*.cjs",
      "node_modules/",
      "dist/",
      "coverage/",
      "eslint.config.js",
    ],
  },
  // Type-aware linting setup
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    languageOptions: {
      ...(config.languageOptions ?? {}),
      parserOptions: {
        ...(config.languageOptions?.parserOptions ?? {}),
        project,
        tsconfigRootDir: process.cwd(),
      },
    },
  })),
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "only-warn": onlyWarn,
      import: importPlugin,
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
      prettier: prettierPlugin,
    },
    rules: {
      "simple-import-sort/exports": "error",
      "unused-imports/no-unused-imports": "warn",
      "simple-import-sort/imports": "error",
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
          trailingComma: "all",
        },
      ],
      "import/no-default-export": "error",
      "no-duplicate-imports": "error",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      // "@typescript-eslint/switch-exhaustiveness-check": "error"
      // General cross-module restrictions are handled in specific overrides below
    },
  },
];
