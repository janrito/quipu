import OptionsSync from "webext-options-sync";

export default new OptionsSync({
  defaults: {
    pinboardAPIToken: null,
    pinboardRootTag: ".quipu",
    pages: [{ name: "Home", cards: ["Clipboard", "to-read"] }],
    tabDecayHalfLife: 30 * 24 * 60 * 60 * 1000,
    tabDecayExceptions: [],
  },
  migrations: [OptionsSync.migrations.removeUnused],
  logging: true,
});
