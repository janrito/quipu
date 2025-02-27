import browser from "webextension-polyfill";

import cacheable from "../lib/cacheable.js";
import {
  DECAY_LOG_CACHE_KEY,
  DECAYED_TAB_PREFIX,
  KEEP_N_DECAYED_TABS,
  UPDATE_EVENT_TYPES,
} from "../lib/constants.js";
import { TabBookmarkSchema } from "../lib/types.js";
import { tabToTabBookMark } from "../lib/utils.js";

const decayedTabs = () => {
  const { subscribe, update, sync } = cacheable<TabBookmarkSchema[]>(
    DECAY_LOG_CACHE_KEY,
    UPDATE_EVENT_TYPES
  );

  const add = (decayingTab: browser.Tabs.Tab) => {
    update(value =>
      [
        tabToTabBookMark(decayingTab, -1, DECAYED_TAB_PREFIX),
        ...(value ? value.filter(decayedTab => decayingTab.url !== String(decayedTab.href)) : []),
      ]
        .slice(0, KEEP_N_DECAYED_TABS)
        .map(
          (tab: TabBookmarkSchema, idx: number) =>
            ({
              ...tab,
              id: `${DECAYED_TAB_PREFIX}-${idx}`,
              _id: idx,
            }) as TabBookmarkSchema
        )
    );
  };

  return {
    sync,
    subscribe,
    add,
  };
};
export default decayedTabs();
