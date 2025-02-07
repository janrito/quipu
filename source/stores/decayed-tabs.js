import cacheable from "../lib/cacheable";
import {
  DECAY_LOG_CACHE_KEY,
  DECAYED_TAB_PREFIX,
  KEEP_N_DECAYED_TABS,
  UPDATE_EVENT_TYPES,
} from "../lib/constants";

const decayedTabs = () => {
  const { subscribe, update, sync } = cacheable(DECAY_LOG_CACHE_KEY, UPDATE_EVENT_TYPES);

  const add = decayingTab => {
    update(value =>
      [
        decayingTab,
        ...(value ? value.filter(decayedTab => decayingTab.url !== decayedTab.url) : []),
      ]
        .slice(0, KEEP_N_DECAYED_TABS)
        .map((tab, idx) => ({
          ...tab,
          id: `${DECAYED_TAB_PREFIX}-${idx}`,
          _id: tab.id,
        }))
    );
  };

  return {
    sync,
    subscribe,
    add,
  };
};
export default decayedTabs();
