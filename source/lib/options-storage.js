import OptionsSync from "webext-options-sync";

export default new OptionsSync({
  defaults: {
    pinboardAPIToken: null,
    pinboardRootTag: ".quipu",
    pages: [{ name: "Home", cards: ["Clipboard", "to-read"] }],
  },
  migrations: [OptionsSync.migrations.removeUnused],
  logging: true,
});
