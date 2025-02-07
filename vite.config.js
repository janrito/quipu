// vite.config.js
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import webExtension from "vite-plugin-web-extension";
export default defineConfig({
  assetsInclude: ["**/*.png"],
  plugins: [
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
