import { throttle } from "lodash";
import { writable } from "svelte/store";
import browser from "webextension-polyfill";
import { storage } from "wxt/storage";

const cacheable = <T>(
  cacheKey: string,
  updateOnEvents: Array<keyof typeof browser.tabs>,
  initial: T
) => {
  const cache = storage.defineItem<T>(`session:cache-${cacheKey}`, { init: () => initial });
  const reader = (set: (value: T) => void) => async () => {
    await cache.getValue().then(value => {
      if (value) {
        set(value);
      }
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
    await cache.getValue().then(value => {
      const newValue = fn(value);
      cache.setValue(newValue);
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
