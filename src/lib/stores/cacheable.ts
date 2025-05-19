import { throttle } from "lodash";
import { writable } from "svelte/store";
import { browser } from "wxt/browser";

function cacheable<T extends object, ST extends object = T>(
  cacheKey: string,
  updateOnEvents: Array<keyof typeof browser.tabs>,
  initial: ST,
  serialize: (value: T) => ST = value => value as unknown as ST,
  deserialize: (value: ST) => T = value => value as unknown as T
) {
  const storageType = "local";
  const cache = storage.defineItem<ST>(`${storageType}:cache-${cacheKey}`, {
    init: () => initial,
  });
  const reader = (set: (value: T) => void) => async () => {
    await cache.getValue().then(value => {
      if (value) {
        set(deserialize(value));
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
  const read = throttle(reader(set), 1000 * 5);

  const updateAndCache = async (fn: (value: T) => Promise<T>) =>
    await cache
      .getValue()
      .then(value =>
        fn(deserialize(value)).then(newValue =>
          cache.setValue(serialize(newValue)).then(() => read())
        )
      );
  read();
  return {
    sync: read,
    subscribe,
    update: updateAndCache,
  };
}
export default cacheable;
