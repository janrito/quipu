import { writable } from "svelte/store";
import browser from "webextension-polyfill";

import { UPDATED_SETTINGS_EVENT } from "../lib/constants";
import optionsStorage from "../lib/options-storage";

const generateNewName = (currentNames, prefix = "New", n = 0) => {
  const _prefix = prefix.replaceAll(/\s+/gi, "-");
  const suggestion = n > 0 ? `${_prefix}-${n}` : _prefix;
  if (!currentNames.includes(suggestion)) {
    return suggestion;
  }
  return generateNewName(currentNames, _prefix, n + 1);
};

const storable = () => {
  let currentValue;

  const { subscribe, set } = writable(currentValue);

  const read = async () => {
    await optionsStorage.getAll().then(value => {
      currentValue = value;
      set(value);
    });
  };

  const setAndSave = value => {
    optionsStorage.setAll(value).then(() => {
      set(value);
      currentValue = value;
    });
    browser.runtime.sendMessage({ event: UPDATED_SETTINGS_EVENT });
  };

  const updateAndSave = fn => {
    setAndSave(fn(currentValue));
  };

  const newCard = (pageIndex, cardIndex = 0) => {
    const currentCards = currentValue.pages[pageIndex].cards;
    if (currentCards) {
      const _cardIndex = cardIndex <= currentCards.length ? cardIndex : 0;
      updateAndSave(value => {
        value.pages[pageIndex].cards = [
          ...currentCards.slice(0, _cardIndex),
          generateNewName(currentCards, "New"),
          ...currentCards.slice(_cardIndex),
        ];
        return value;
      });
    } else {
      updateAndSave(value => {
        value.pages[pageIndex].cards = [generateNewName([], "New")];
        return value;
      });
    }
  };

  const renameCard = (pageIndex, cardIndex, name) => {
    if (currentValue.pages[pageIndex] && currentValue.pages[pageIndex].cards[cardIndex]) {
      updateAndSave(value => {
        const otherCards = value.pages[pageIndex].cards.filter((_, i) => i !== cardIndex);
        value.pages[pageIndex].cards[cardIndex] = generateNewName(otherCards, name);
        return value;
      });
    }
  };

  const newPage = () => {
    updateAndSave(value => {
      value.pages = [
        ...value.pages,
        {
          name: generateNewName(
            value.pages.map(p => p.name),
            "New"
          ),
        },
      ];
      return value;
    });
  };

  const renamePage = (pageIndex, name) => {
    if (currentValue.pages[pageIndex]) {
      updateAndSave(value => {
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
