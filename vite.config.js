// vite.config.js
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  assetsInclude: ["**/*.png"],
  plugins: [
    tailwindcss(),
    svelte({
      preprocess: [vitePreprocess({ typescript: true })],
    }),
    webExtension({
      // manifest: target == "chrome" ? "manifest.chrome.json" : "manifest.firefox.json",
      manifest: "manifest.json",
      browser: process.env.TARGET,
    }),
  ],
});
