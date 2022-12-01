import throttle from "lodash/throttle";
import { writable } from "svelte/store";
import cache from "webext-storage-cache";

import { KEEP_N_DECAYED_TABS, UPDATE_EVENT_TYPES } from "../lib/constants";

const cacheable = () => {
  const cacheKey = "decay-log";
  const reader = set => async () => {
    await cache.get(cacheKey).then(value => {
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

  const add = async closedTab => {
    await cache.get(cacheKey).then(value => {
      const filteredSavedTabs = [
        closedTab,
        ...(value ? value.filter(savedTab => closedTab.url !== savedTab.url) : []),
      ];
      cache.set(cacheKey, filteredSavedTabs.slice(0, KEEP_N_DECAYED_TABS));
      read();
    });
  };

  read();
  return {
    subscribe,
    add,
  };
};
export default cacheable();
