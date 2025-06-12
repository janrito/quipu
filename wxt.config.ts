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

    const permissions = { permissions: ["storage", "tabs", "alarms", "*://api.pinboard.in/*"] };
    const host_permissions =
      manifestVersion === 3 ? { host_permissions: permissions.permissions } : {};

    return {
      ...permissions,
      ...host_permissions,
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
