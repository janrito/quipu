import LZString from "lz-string";

import type { AppSettingsSchema } from "./types.js";

const { decompressFromEncodedURIComponent } = LZString;
const fallback = {
  pinboardAPIToken: "",
  pinboardRootTag: ".quipu",
  pages: [{ name: "Home", cards: ["Clipboard", "to-read"] }],
  tabDecayHalfLife: 30 * 24 * 60 * 60 * 1000,
  tabDecayExceptions: [],
};
export const optionsStorage = storage.defineItem<AppSettingsSchema>("sync:options", {
  init: () => fallback,
  version: 2,
  migrations: {
    2: (compressedOptions: string): AppSettingsSchema => {
      return (
        compressedOptions && compressedOptions.length
          ? JSON.parse(decompressFromEncodedURIComponent(compressedOptions))
          : fallback
      ) as AppSettingsSchema;
    },
  },
});
