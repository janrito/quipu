import browser from "webextension-polyfill";

import cacheable from "../lib/cacheable";
import {
  DECAY_LOG_CACHE_KEY,
  DECAYED_TAB_PREFIX,
  KEEP_N_DECAYED_TABS,
  UPDATE_EVENT_TYPES,
} from "../lib/constants";

type DecayedTab = browser.Tabs.Tab & { _id: number; id: string };

const decayedTabs = () => {
  const { subscribe, update, sync } = cacheable<DecayedTab[]>(
    DECAY_LOG_CACHE_KEY,
    UPDATE_EVENT_TYPES
  );

  const add = (decayingTab: browser.Tabs.Tab) => {
    update(value =>
      [
        { ...decayingTab, _id: decayingTab.id, id: `${DECAYED_TAB_PREFIX}-{temp}` } as DecayedTab,
        ...(value
          ? value.filter(decayedTab => decayingTab.url !== decayedTab.url)
          : ([] as DecayedTab[])),
      ]
        .slice(0, KEEP_N_DECAYED_TABS)
        .map(
          (tab: DecayedTab, idx: number) =>
            ({
              ...tab,
              id: `${DECAYED_TAB_PREFIX}-${idx}`,
            }) as DecayedTab
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
