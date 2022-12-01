const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./source/**/*.{js,svelte,html}"],
  theme: {
    fontFamily: {
      sans: [...defaultTheme.fontFamily.sans],
      serif: [...defaultTheme.fontFamily.serif],
      mono: ["Iosevka", ...defaultTheme.fontFamily.mono],
    },
    minHeight: {
      5: "1.25rem",
      10: "2.5rem",
      "1/4": "25%",
      "1/2": "50%",
      "3/4": "75%",
      ...defaultTheme.minHeight,
    },
    extend: {
      colors: {
        head: process.env.NODE_ENV === "production" ? colors.gray : colors.fuchsia,
      },
    },
  },
};
