const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./src/**/*.{js,ts,svelte,html}"],
  theme: {
    extend: {
      colors: {
        head: import.meta.env.PROD ? colors.gray : colors.fuchsia,
      },
    },
  },
};
