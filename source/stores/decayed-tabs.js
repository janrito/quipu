import cacheable from "../lib/cacheable";
import { DECAY_LOG_CACHE_KEY, KEEP_N_DECAYED_TABS, UPDATE_EVENT_TYPES } from "../lib/constants";

const decayedTAbs = () => {
  const { subscribe, update } = cacheable(DECAY_LOG_CACHE_KEY, UPDATE_EVENT_TYPES);

  const add = decayingTab => {
    update(value =>
      [
        decayingTab,
        ...(value ? value.filter(decayedTab => decayingTab.url !== decayedTab.url) : []),
      ].slice(0, KEEP_N_DECAYED_TABS)
    );
  };

  return {
    subscribe,
    add,
  };
};
export default decayedTAbs();
