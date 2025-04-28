import { throttle } from "lodash";
import { readable } from "svelte/store";
import { browser } from "wxt/browser";

import { TAB_QUERY, UPDATE_EVENT_TYPES } from "../constants.js";
import { TabBookmarkSchema } from "../types.js";
import { tabToTabBookMark } from "../utils.js";

export default readable(
  new Map<number, TabBookmarkSchema[]>(),
  (set: (value: Map<number, TabBookmarkSchema[]>) => void) => {
    const updateTabs = throttle(
      async () => {
        const tabs: Map<number, TabBookmarkSchema[]> = await browser.tabs
          .query(TAB_QUERY)
          .then(async tabs => {
            const currentWindow = await browser.windows.getCurrent();
            return new Map(
              [
                ...tabs
                  .filter(tab => tab.url)
                  .map(tab => tabToTabBookMark(tab))
                  // sort by the order that each tab appears
                  .sort((a, b) => a.index - b.index)
                  .reduce((accumulator, current) => {
                    // group tabs by window
                    if (accumulator.has(current.windowId)) {
                      accumulator.set(current.windowId, [
                        ...(accumulator.get(current.windowId) || []),
                        current,
                      ]);
                    } else {
                      accumulator.set(current.windowId, [current]);
                    }

                    return accumulator;
                  }, new Map<number, TabBookmarkSchema[]>())
                  .entries(),
              ].sort((windowA, windowB) => {
                // order current window first
                if (windowA[0] === currentWindow.id) {
                  return -1;
                } else if (windowB[0] === currentWindow.id) {
                  return 1;
                }
                return 0;
              })
            );
          });

        set(tabs);
      },
      500,
      { leading: false, trailing: true }
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
  }
);
