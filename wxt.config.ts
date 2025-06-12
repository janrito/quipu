import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte", "@wxt-dev/auto-icons"],
  manifest: ({ browser, manifestVersion, mode }) => {
    const devDefinitions =
      mode === "development" && browser === "firefox"
        ? {
            applications: {
              gecko: { id: "alejandro@giacometti.me" },
            },
          }
        : {};

    const host_permissions = ["*://api.pinboard.in/*"];
    const permissions = ["storage", "tabs", "alarms"];

    const all_permissions =
      manifestVersion === 3
        ? { permissions: permissions, host_permissions: host_permissions }
        : { permissions: [...permissions, ...host_permissions] };

    return {
      ...all_permissions,
      ...devDefinitions,
    };
  },
  imports: {
    eslintrc: { enabled: 9 },
  },
  vite: ({ mode }) => ({
    server:
      mode === "development"
        ? {
            cors: true,
          }
        : {},
    build: {
      sourcemap: true,
      minify: mode === "production" ? "terser" : "terser",
    },
  }),
});
