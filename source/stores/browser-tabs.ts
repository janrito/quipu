import throttle from "lodash/throttle";
import { readable } from "svelte/store";
import browser from "webextension-polyfill";

import { BROWSER_TAB_PREFIX, TAB_QUERY, UPDATE_EVENT_TYPES } from "../lib/constants";
import { BrowserTab } from "../lib/types";

export default readable([], (set: (value: BrowserTab[]) => void) => {
  const updateTabs = throttle(
    async () => {
      const tabs: BrowserTab[] = await browser.tabs.query(TAB_QUERY).then(async tabs => {
        const currentWindow = await browser.windows.getCurrent();
        return (
          [
            ...tabs
              .map((tab, idx) => ({
                ...tab,
                id: `${BROWSER_TAB_PREFIX}-${idx}`,
                _id: tab.id,
              }))
              // sort by the order that each tab appears
              .sort((a, b) => (a.index < b.index ? -1 : a.index > b.index ? 1 : 0))
              .reduce((accumulator, current) => {
                // group tabs by window
                if (accumulator.has(current.windowId)) {
                  accumulator.get(current.windowId).push(current);
                } else {
                  accumulator.set(current.windowId, [current]);
                }
                return accumulator;
              }, new Map())
              .entries(),
          ]
            .sort((windowA, windowB) =>
              // order current window first
              windowA[0] === currentWindow.id ? -1 : windowB[0] === currentWindow.id ? 1 : 0
            )
            // remove window id
            .map(d => d[1])
        );
      });

      set(tabs);
    },
    1000,
    { trailing: true }
  );
  const attachEvents = () => {
    UPDATE_EVENT_TYPES.forEach(eventType => {
      const event = browser.tabs[eventType as keyof typeof browser.tabs];
      if (event && typeof event === "object" && "addListener" in event) {
        event.addListener(updateTabs);
      }
    });
  };
  const detachEvents = () => {
    UPDATE_EVENT_TYPES.forEach(eventType => {
      const event = browser.tabs[eventType as keyof typeof browser.tabs];
      if (event && typeof event === "object" && "removeListener" in event) {
        event.removeListener(updateTabs);
      }
    });
  };
  attachEvents();

  return detachEvents;
});
