const purgecss = {
  "@fullhuman/postcss-purgecss": {
    content: [
      "./source/**/*.html",
      "./source/**/*.svg",
      "./source/**/*.js",
      "./source/**/*.svelte",
    ],
    safelist: [/svelte-/, /grid-cols-/],
    defaultExtractor: content => [
      ...(content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []),
      ...(content.match(/(?<=class:)[^=>\/\s]*/g) || []),
    ],
  },
};
module.exports = {
  plugins: {
    "postcss-import": {},
    "postcss-url": {},
    "postcss-custom-properties": {},
    "postcss-fontpath": { checkFiles: true, ie8Fix: true },
    tailwindcss: "tailwind.config.js",
    autoprefixer: {},
    "postcss-nested": {},
    ...(process.env.NODE_ENV === "production" ? purgecss : {}),
  },
};
