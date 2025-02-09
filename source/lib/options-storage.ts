import OptionsSync from "webext-options-sync";

export const decodeOptions = (obj: { [key: string]: string | number | boolean }) =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (typeof value === "string") {
        try {
          const o = JSON.parse(value);
          if (typeof o === "object") {
            return [key, o];
          }
        } catch {
          /* empty */
        }
      }
      return [key, value];
    })
  );

export const encodeOptions = (obj: { [key: string]: unknown }) =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      value && typeof value === "object" ? JSON.stringify(value) : value,
    ])
  );

export const optionsStorage = new OptionsSync({
  defaults: {
    pinboardAPIToken: "",
    pinboardRootTag: ".quipu",
    pages: '[{ "name": "Home", "cards": ["Clipboard", "to-read"] }]',
    tabDecayHalfLife: 30 * 24 * 60 * 60 * 1000,
    tabDecayExceptions: "[]",
  },
  migrations: [OptionsSync.migrations.removeUnused],
  logging: true,
});
