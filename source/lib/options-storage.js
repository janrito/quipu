import OptionsSync from "webext-options-sync";

export default new OptionsSync({
  defaults: {
    pinboardAPIToken: null,
    pinboardRootTag: ".quipu",
    pages: [
      { name: ".quipu:home", cards: ["Management_Strategy", "Clipboard"] },
      { name: ".quipu:ai", cards: ["ai_in_retail"] },
    ],
  },
  migrations: [OptionsSync.migrations.removeUnused],
  logging: true,
});
