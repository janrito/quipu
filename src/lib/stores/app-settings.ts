import { writable } from "svelte/store";

import { sendMessage } from "../messaging.js";
import { optionsStorage } from "../options-storage.js";
import { AppSettingsSchema, PageSchema } from "../types.js";

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

  const { subscribe, set } = writable<AppSettingsSchema>();

  const read = async () => {
    await optionsStorage.getValue().then(value => {
      currentValue = value;
      set(value);
    });
  };

  const setAndSave = (value: AppSettingsSchema) => {
    Promise.all([optionsStorage.setValue(value), optionsStorage.setMeta({ v: 2 })]).then(() => {
      set(value);
      currentValue = value;
      sendMessage("updatedSettings", undefined);
    });
  };

  const updateAndSave = (fn: (value: AppSettingsSchema) => AppSettingsSchema) => {
    setAndSave(fn(currentValue));
  };

  const newCard = (pageIndex: number, cardIndex: number = 0) => {
    if (currentValue.pages[pageIndex].cards) {
      const _cardIndex = cardIndex <= currentValue.pages[pageIndex].cards.length ? cardIndex : 0;
      updateAndSave((value: AppSettingsSchema) => {
        value.pages[pageIndex].cards = [
          ...value.pages[pageIndex].cards.slice(0, _cardIndex),
          generateNewName(value.pages[pageIndex].cards, "New"),
          ...value.pages[pageIndex].cards.slice(_cardIndex),
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

  const reorderCards = (pageIndex: number, cards: string[]) => {
    if (
      new Set(cards).symmetricDifference(new Set(currentValue.pages[pageIndex].cards)).size === 0
    ) {
      updateAndSave((value: AppSettingsSchema) => {
        value.pages[pageIndex].cards = cards;
        return value;
      });
    }
  };

  const deleteCard = (pageIndex: number, cardIndex: number) => {
    if (currentValue.pages[pageIndex] && currentValue.pages[pageIndex].cards[cardIndex]) {
      updateAndSave((value: AppSettingsSchema) => {
        value.pages[pageIndex].cards = value.pages[pageIndex].cards.filter((_, index) => {
          return index !== cardIndex;
        });

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
        } as PageSchema,
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

  const reorderPages = (names: string[]) => {
    if (
      new Set(names).symmetricDifference(new Set(currentValue.pages.map(p => p.name))).size === 0
    ) {
      updateAndSave((value: AppSettingsSchema) => {
        value.pages = names.map(name => value.pages.find(p => p.name === name) as PageSchema);
        return value;
      });
    }
  };

  const deletePage = (pageIndex: number) => {
    if (currentValue.pages[pageIndex]) {
      updateAndSave((value: AppSettingsSchema) => {
        value.pages = value.pages.filter((_, index) => index !== pageIndex);
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
    reorderCards,
    deleteCard,
    newPage,
    renamePage,
    reorderPages,
    deletePage,
  };
};

export default storable();
