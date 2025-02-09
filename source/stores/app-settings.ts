import { writable } from "svelte/store";
import browser from "webextension-polyfill";

import { UPDATED_SETTINGS_EVENT } from "../lib/constants";
import {
  AppSettingsSchema,
  decodeOptions,
  encodeOptions,
  optionsStorage,
  PagesSchema,
} from "../lib/options-storage";

const generateNewName = (currentNames: string[], prefix: string = "New", n: number = 0) => {
  const _prefix = prefix.replaceAll(/\s+/gi, "-");
  const suggestion = n > 0 ? `${_prefix}-${n}` : _prefix;
  if (!currentNames.includes(suggestion)) {
    return suggestion;
  }
  return generateNewName(currentNames, _prefix, n + 1);
};

const storable = () => {
  let currentValue: AppSettingsSchema;

  const { subscribe, set } = writable();

  const read = async () => {
    await optionsStorage.getAll().then(value => {
      currentValue = decodeOptions(value);
      console.log("settings read", currentValue, value);
      set(currentValue);
    });
  };

  const setAndSave = (value: AppSettingsSchema) => {
    const encodedValue = encodeOptions(value);

    optionsStorage.setAll(encodedValue).then(() => {
      set(value);
      console.log("Settings saved", value, encodedValue);
      currentValue = value;
    });
    browser.runtime.sendMessage({ event: UPDATED_SETTINGS_EVENT });
  };

  const updateAndSave = (fn: (value: AppSettingsSchema) => AppSettingsSchema) => {
    setAndSave(fn(currentValue));
  };

  const newCard = (pageIndex: number, cardIndex: number = 0) => {
    const currentCards = currentValue.pages[pageIndex].cards;
    if (currentCards) {
      const _cardIndex = cardIndex <= currentCards.length ? cardIndex : 0;
      updateAndSave((value: AppSettingsSchema) => {
        value.pages[pageIndex].cards = [
          ...currentCards.slice(0, _cardIndex),
          generateNewName(currentCards, "New"),
          ...currentCards.slice(_cardIndex),
        ];
        return value;
      });
    } else {
      updateAndSave((value: AppSettingsSchema) => {
        value.pages[pageIndex].cards = [generateNewName([], "New")];
        return value;
      });
    }
  };

  const renameCard = (pageIndex: number, cardIndex: number, name: string) => {
    if (currentValue.pages[pageIndex] && currentValue.pages[pageIndex].cards[cardIndex]) {
      updateAndSave((value: AppSettingsSchema) => {
        const otherCards = value.pages[pageIndex].cards.filter((_, i) => i !== cardIndex);
        value.pages[pageIndex].cards[cardIndex] = generateNewName(otherCards, name);
        return value;
      });
    }
  };

  const newPage = () => {
    updateAndSave((value: AppSettingsSchema) => {
      value.pages = [
        ...value.pages,
        {
          name: generateNewName(
            value.pages.map(p => p.name),
            "New"
          ),
        } as PagesSchema,
      ];
      return value;
    });
  };

  const renamePage = (pageIndex: number, name: string) => {
    if (currentValue.pages[pageIndex]) {
      updateAndSave((value: AppSettingsSchema) => {
        value.pages[pageIndex].name = generateNewName(
          value.pages.filter((_, idx) => idx !== pageIndex).map(p => p.name),
          name
        );
        return value;
      });
    }
  };

  read();

  return {
    subscribe,
    set: setAndSave,
    update: updateAndSave,
    read,
    newCard,
    renameCard,
    newPage,
    renamePage,
  };
};

export default storable();
