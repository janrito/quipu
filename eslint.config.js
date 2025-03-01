import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import typescript from "typescript-eslint";

import autoImports from "./.wxt/eslint-auto-imports.mjs";

export default [
  autoImports,
  js.configs.recommended,
  ...typescript.configs.recommended,
  ...svelte.configs["flat/recommended"],
  prettier,
  ...svelte.configs["flat/prettier"],

  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.webextensions, ...globals.browser },

      parserOptions: {
        projectService: true,
        parser: typescript.parser,
        extraFileExtensions: [".svelte"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.svelte", "*.svelte"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.webextensions, ...globals.browser },
      parser: svelteParser,
      parserOptions: {
        projectService: true,
        parser: typescript.parser,
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
      "svelte/no-target-blank": "error",
      "svelte/no-at-debug-tags": "error",
      "svelte/no-reactive-functions": "error",
      "svelte/no-reactive-literals": "error",
    },
  },
  {
    rules: {
      semi: ["warn", "always"],
      quotes: ["warn", "double", { avoidEscape: true, allowTemplateLiterals: true }],
      "no-nested-ternary": "error",
      "linebreak-style": ["error", "unix"],
      "no-cond-assign": ["error", "always"],
      "@typescript-eslint/sort-type-constituents": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  {
    ignores: [
      "node_modules",
      ".output",
      ".wxt",
      "package.json",
      "package-lock.json",
      "*.config.js",
      ".editorconfig",
    ],
  },
];
