import throttle from "lodash/throttle";
import { writable } from "svelte/store";
import cache from "webext-storage-cache/legacy.js";
import browser from "webextension-polyfill";

const cacheable = <T>(cacheKey: string, updateOnEvents: Array<keyof typeof browser.tabs>) => {
  const reader = (set: (value: T) => void) => async () => {
    await cache.get(cacheKey).then(value => {
      set((value && typeof value === "string" ? JSON.parse(value) : []) as T);
    });
  };
  const { subscribe, set } = writable([] as T, set => {
    const throttledRead = throttle(reader(set));

    const attachEvents = () => {
      updateOnEvents.forEach(eventType => {
        const event = browser.tabs[eventType as keyof typeof browser.tabs];
        if (event && typeof event === "object" && "addListener" in event) {
          event.addListener(throttledRead);
        }
      });
    };

    const detachEvents = () => {
      updateOnEvents.forEach(eventType => {
        const event = browser.tabs[eventType as keyof typeof browser.tabs];
        if (event && typeof event === "object" && "removeListener" in event) {
          event.removeListener(throttledRead);
        }
      });
    };

    attachEvents();

    return detachEvents;
  });
  const read = reader(set);

  const updateAndCache = async (fn: (value: T) => T) => {
    await cache.get(cacheKey).then(value => {
      const newValue = fn((value && typeof value === "string" ? JSON.parse(value) : []) as T);
      cache.set(cacheKey, JSON.stringify(newValue));
      set(newValue);
    });
  };

  read();
  return {
    sync: read,
    subscribe,
    update: updateAndCache,
  };
};
export default cacheable;
