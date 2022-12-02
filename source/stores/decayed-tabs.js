import throttle from "lodash/throttle";
import { writable } from "svelte/store";
import cache from "webext-storage-cache";

import { DECAY_LOG_CACHE_KEY, KEEP_N_DECAYED_TABS, UPDATE_EVENT_TYPES } from "../lib/constants";

const cacheable = () => {
  const reader = set => async () => {
    await cache.get(DECAY_LOG_CACHE_KEY).then(value => {
      set(value || []);
    });
  };
  const { subscribe, set } = writable([], set => {
    const throttledRead = throttle(reader(set));

    const attachEvents = () => {
      UPDATE_EVENT_TYPES.map(eventType => {
        browser.tabs[eventType].addListener(throttledRead);
      });
    };
    const detachEvents = () => {
      UPDATE_EVENT_TYPES.map(eventType => {
        browser.tabs[eventType].removeListener(throttledRead);
      });
    };

    attachEvents();

    return detachEvents;
  });
  const read = reader(set);

  const add = async decayingTab => {
    await cache.get(DECAY_LOG_CACHE_KEY).then(value => {
      const filteredDecayedTabs = [
        decayingTab,
        ...(value ? value.filter(decayedTab => decayingTab.url !== decayedTab.url) : []),
      ];
      const newValue = filteredDecayedTabs.slice(0, KEEP_N_DECAYED_TABS);
      cache.set(DECAY_LOG_CACHE_KEY, newValue);
      set(newValue);
    });
  };

  read();
  return {
    subscribe,
    add,
  };
};
export default cacheable();
