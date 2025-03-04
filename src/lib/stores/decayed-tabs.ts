import browser from "webextension-polyfill";

import {
  DECAY_LOG_CACHE_KEY,
  DECAYED_TAB_PREFIX,
  KEEP_N_DECAYED_TABS,
  UPDATE_EVENT_TYPES,
} from "../constants.js";
import { SerializedTabBookmarkSchema, TabBookmarkSchema } from "../types.js";
import { tabToTabBookMark } from "../utils.js";
import cacheable from "./cacheable.js";

const serializeTabBookmarks = (tabBookmarks: TabBookmarkSchema[]): SerializedTabBookmarkSchema[] =>
  tabBookmarks.map(
    t =>
      ({
        ...t,
        href: t.href.toString(),
        favIconUrl: t.favIconUrl?.toString(),
      }) as SerializedTabBookmarkSchema
  );

const deSerializeTabBookmarks = (
  tabBookmarks: SerializedTabBookmarkSchema[]
): TabBookmarkSchema[] =>
  tabBookmarks.map(
    t =>
      ({
        ...t,
        href: new URL(t.href),
        favIconUrl: t.favIconUrl && new URL(t.favIconUrl),
      }) as TabBookmarkSchema
  );

const decayedTabs = () => {
  const { subscribe, update, sync } = cacheable<TabBookmarkSchema[], SerializedTabBookmarkSchema[]>(
    DECAY_LOG_CACHE_KEY,
    UPDATE_EVENT_TYPES,
    [],
    serializeTabBookmarks,
    deSerializeTabBookmarks
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
