module.exports = {
  plugins: {
    "postcss-import": {},
    "postcss-url": {},
    "postcss-custom-properties": {},
    "postcss-fontpath": { checkFiles: true, ie8Fix: true },
    tailwindcss: "tailwind.config.js",
    "postcss-nested": {},
  },
  ...(process.env.NODE_ENV === "production" ? { cssnano: {} } : {}),
};
