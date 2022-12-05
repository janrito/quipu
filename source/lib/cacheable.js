import throttle from "lodash/throttle";
import { writable } from "svelte/store";
import cache from "webext-storage-cache";

const cacheable = (cacheKey, updateOnEvents) => {
  const reader = set => async () => {
    await cache.get(cacheKey).then(value => {
      set(value || []);
    });
  };
  const { subscribe, set } = writable([], set => {
    const throttledRead = throttle(reader(set));

    const attachEvents = () => {
      updateOnEvents.map(eventType => {
        browser.tabs[eventType].addListener(throttledRead);
      });
    };
    const detachEvents = () => {
      updateOnEvents.map(eventType => {
        browser.tabs[eventType].removeListener(throttledRead);
      });
    };

    attachEvents();

    return detachEvents;
  });
  const read = reader(set);

  const updateAndCache = async fn => {
    await cache.get(cacheKey).then(value => {
      const newValue = fn(value);
      cache.set(cacheKey, newValue);
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
