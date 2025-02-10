import OptionsSync from "webext-options-sync";

import { AppSettingsSchema, EncodedAppSettingsSchema, PagesSchema } from "./types";

export const decodeOptions = (obj: EncodedAppSettingsSchema): AppSettingsSchema => ({
  pinboardAPIToken: obj.pinboardAPIToken,
  pinboardRootTag: obj.pinboardRootTag,
  pages: JSON.parse(obj.pages) as PagesSchema[],
  tabDecayHalfLife: Number(obj.tabDecayHalfLife),
  tabDecayExceptions: JSON.parse(obj.tabDecayExceptions) as string[],
});

export const encodeOptions = (obj: AppSettingsSchema): EncodedAppSettingsSchema => ({
  pinboardAPIToken: obj.pinboardAPIToken,
  pinboardRootTag: obj.pinboardRootTag,
  pages: JSON.stringify(obj.pages),
  tabDecayHalfLife: obj.tabDecayHalfLife,
  tabDecayExceptions: JSON.stringify(obj.tabDecayExceptions),
});

export const optionsStorage = new OptionsSync({
  defaults: {
    pinboardAPIToken: "",
    pinboardRootTag: ".quipu",
    pages: '[{ "name": "Home", "cards": ["Clipboard", "to-read"] }]',
    tabDecayHalfLife: 30 * 24 * 60 * 60 * 1000,
    tabDecayExceptions: "[]",
  },
  migrations: [
    savedOptions => {
      // Stringify pages and tabDecayExceptions if they are not strings
      if (typeof savedOptions.pages !== "string") {
        savedOptions.pages = JSON.stringify(savedOptions.pages);
      }
      if (typeof savedOptions.tabDecayExceptions !== "string") {
        savedOptions.tabDecayExceptions = JSON.stringify(savedOptions.tabDecayExceptions);
      }
    },
    OptionsSync.migrations.removeUnused,
  ],
  logging: true,
});
