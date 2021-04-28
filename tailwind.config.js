const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  purge: false,
  theme: {
    fontFamily: {
      sans: [...defaultTheme.fontFamily.sans],
      serif: [...defaultTheme.fontFamily.serif],
      mono: ["Iosevka Web", ...defaultTheme.fontFamily.mono],
    },
    minHeight: {
      5: "1.25rem",
      10: "2.5rem",
      "1/4": "25%",
      "1/2": "50%",
      "3/4": "75%",
      ...defaultTheme.minHeight,
    },
  },
  variants: {},
};
