import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";

// Resolve project root correctly for parserOptions
const __dirname = dirname(fileURLToPath(import.meta.url));
const project = "./tsconfig.eslint.json";

export default [
  {
    ignores: [
      ".*.js",
      ".*.cjs",
      "node_modules/",
      "dist/",
      "coverage/",
      "eslint.config.mjs",
      "scripts/",
      "docs/agentic-commerce/",
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
        tsconfigRootDir: __dirname,
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
    },
  },
];
