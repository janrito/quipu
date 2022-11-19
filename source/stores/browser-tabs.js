import throttle from "lodash/throttle";
import { readable } from "svelte/store";
import browser from "webextension-polyfill";

import { BROWSER_TAB_PREFIX, TAB_QUERY } from "../lib/constants";

export default readable([], set => {
  const eventTypes = ["onAttached", "onDetached", "onMoved", "onRemoved", "onUpdated"];
  const updateTabs = throttle(
    async () => {
      const tabs = await browser.tabs
        .query(TAB_QUERY)
        .then(tabs =>
          tabs.map((tab, idx) => ({ ...tab, id: `${BROWSER_TAB_PREFIX}-${idx}`, _id: tab.id }))
        );
      set(tabs);
    },
    3000,
    { trailing: true }
  );
  const attachEvents = () => {
    eventTypes.map(eventType => {
      browser.tabs[eventType].addListener(updateTabs);
    });
  };
  const detachEvents = () => {
    eventTypes.map(eventType => {
      browser.tabs[eventType].removeListener(updateTabs);
    });
  };
  attachEvents();

  return detachEvents;
});
