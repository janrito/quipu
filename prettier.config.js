export default {
  arrowParens: "avoid",
  bracketSpacing: true,
  bracketSameLine: true,
  plugins: [
    "prettier-plugin-svelte",
    "prettier-plugin-tailwindcss",
    "@ianvs/prettier-plugin-sort-imports",
  ],
  overrides: [{ files: "*.svelte", options: { parser: "svelte" } }],
  printWidth: 100,
  proseWrap: "preserve",
  requirePragma: false,
  semi: true,
  singleQuote: false,
  tailwindStylesheet: "./source/main.css",
  tailwindConfig: "tailwind.config.js",
  trailingComma: "es5",
  useTabs: false,
  tabWidth: 2,
  svelteSortOrder: "options-styles-scripts-markup",
  svelteStrictMode: true,
  svelteAllowShorthand: true,
  svelteIndentScriptAndStyle: false,
  importOrder: [
    "<BUILTIN_MODULES>",
    "",
    "<THIRD_PARTY_MODULES>",
    "",
    "^stores/(.*)$",
    "^lib/(.*)$",
    "^components/(.*)$",
    "",
    "^[./]",
  ],
};
