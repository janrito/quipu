const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./source/**/*.{js,ts,svelte,html}"],
  theme: {
    extend: {
      colors: {
        head: import.meta.env.PROD ? colors.gray : colors.fuchsia,
      },
    },
  },
};
