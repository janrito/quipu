import { browser } from "wxt/browser";

export const BROWSER_TAB_PREFIX = "tab";
export const DECAYED_TAB_PREFIX = "decayed-tab";

export const TAB_QUERY = {
  url: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*"],
};

export const UPDATE_EVENT_TYPES: Array<keyof typeof browser.tabs> = [
  "onAttached",
  "onDetached",
  "onMoved",
  "onRemoved",
  "onUpdated",
];
export const KEEP_N_DECAYED_TABS = 100;

export const DECAY_LOG_CACHE_KEY = "decay-log";
export const TAB_DECAY_LIFETIMES_CACHE_KEY = "decay-lifetimes";

export const UPDATE_DECAY_DISPLAY_INTERVAL = 1000 * 5;
