export const BROWSER_TAB_PREFIX = "tab";
export const DECAYED_TAB_PREFIX = "decayed-tab";

export const TAB_QUERY = {
  url: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*"],
};

export const UPDATE_EVENT_TYPES = ["onAttached", "onDetached", "onMoved", "onRemoved", "onUpdated"];
export const KEEP_N_DECAYED_TABS = 100;

export const DECAY_LOG_CACHE_KEY = "decay-log";
export const TAB_DECAY_LIFETIMES_CACHE_KEY = "decay-lifetimes";
export const UPDATED_SETTINGS_EVENT = "updatedSettings";

// long delays create problems for setTimeout, they will actually fire immediately
// we also don't want to create events that are so far into the future
// that they will be unlikely to be fired by the current script
// this sets a maximum delay length to actually schedule
export const MAX_DELAY_TO_SCHEDULE = 1000 * 60 * 60 * 24;

export const UPDATE_DECAY_DISPLAY_INTERVAL = 1000 * 60;
