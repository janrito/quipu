module.exports = {
  plugins: {
    "postcss-import": {},
    "postcss-url": {},
    "postcss-custom-properties": {},
    "postcss-fontpath": { checkFiles: true, ie8Fix: true },
    tailwindcss: "tailwind.config.js",
    autoprefixer: {},
    "postcss-nested": {},
  },
  ...(process.env.NODE_ENV === "production" ? { cssnano: {} } : {}),
};
