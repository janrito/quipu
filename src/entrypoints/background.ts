import { debounce } from "lodash";
import { get } from "svelte/store";
import { URLPattern } from "urlpattern-polyfill";
import browser from "webextension-polyfill";

import { MAX_DELAY_TO_SCHEDULE, TAB_QUERY } from "~/lib/constants.js";
import { onMessage } from "~/lib/messaging";
import appSettings from "~/lib/stores/app-settings.js";
import decayedTabs from "~/lib/stores/decayed-tabs.js";
import tabLifetimes from "~/lib/stores/tab-lifetimes.js";
import { AppSettingsSchema, tabLifetimesSchema } from "~/lib/types.js";
import {
  calculateDelay,
  closeTab,
  compileValidURLPatterns,
  findURLPattern,
  getTabLifetimeId,
  lifetimeIdToTabId,
  sampleLifetime,
  tabIdToLifetimeId,
} from "~/lib/utils.js";

const decayTab = debounce(tabId => {
  browser.tabs.get(tabId).then(tab => {
    decayedTabs.add(tab);
    closeTab(tab);
    tabLifetimes.update(currentTabLifetimes => {
      const lifetimeId = getTabLifetimeId(tab);
      if (lifetimeId && currentTabLifetimes[lifetimeId]) {
        delete currentTabLifetimes[lifetimeId];
      }
      return currentTabLifetimes;
    });
  });
}, 100);

const clearTabLifetimes = (tabIds: number[], currentTabLifetimes: tabLifetimesSchema) => {
  const tabIdsSet = new Set(tabIds);
  tabIdsSet.forEach(tabId => {
    const lifetimeId = tabIdToLifetimeId(tabId);
    const { timerId } = currentTabLifetimes[lifetimeId];
    clearTimeout(timerId);
  });
  return Object.fromEntries(
    Object.entries(currentTabLifetimes).filter(pair => {
      const [lifetimeId] = pair;
      return !tabIdsSet.has(lifetimeIdToTabId(lifetimeId));
    })
  ) as tabLifetimesSchema;
};

const setNewTabLifetime = (
  tab: browser.Tabs.Tab,
  currentTabLifetimes: tabLifetimesSchema,
  tabDecayHalfLife: number,
  tabDecayExceptions: URLPattern[] = []
) => {
  if (!tab.id || tab.pinned || findURLPattern(tab.url || "", tabDecayExceptions)) {
    return currentTabLifetimes;
  }

  const lifetimeId = getTabLifetimeId(tab);
  if (!lifetimeId) {
    return currentTabLifetimes;
  }
  const { timerId, lifetime } = currentTabLifetimes[lifetimeId] || {
    lifetime: sampleLifetime(tabDecayHalfLife),
  };
  const delay = calculateDelay(lifetime, tab.lastAccessed);

  if (delay > MAX_DELAY_TO_SCHEDULE) {
    // only set the decay timer on tabs that are likely to decay soon.
    currentTabLifetimes[lifetimeId] = { timerId: undefined, lifetime };
    return currentTabLifetimes;
  }
  if (timerId) {
    // clearing current timer is already set
    clearTimeout(timerId);
  }
  const newTimerId = setTimeout(decayTab, delay, tab.id);
  currentTabLifetimes[lifetimeId] = { timerId: newTimerId, lifetime };
  return currentTabLifetimes;
};

const updateTabLifetimes = debounce(
  async (forceOn: number[] = [], forceOnAll: boolean = false) => {
    await appSettings.read();
    const currentAppSettings = get<AppSettingsSchema>(appSettings);
    const tabDecayHalfLife = currentAppSettings.tabDecayHalfLife;
    const tabDecayExceptions = compileValidURLPatterns(currentAppSettings.tabDecayExceptions);
    const forceOnSet = new Set(forceOn);

    let currentTabLifetimes = get(tabLifetimes);

    if (forceOnAll) {
      currentTabLifetimes = clearTabLifetimes(
        Object.keys(currentTabLifetimes).map(lifetimeId => lifetimeIdToTabId(lifetimeId)),
        currentTabLifetimes
      );
    }

    browser.tabs.query(TAB_QUERY).then(tabs => {
      const tabIds = new Set<number>([]);
      tabs.map(tab => {
        // ignore tabs without ID
        if (!tab.id) return;

        // keep track of all existing tabs
        tabIds.add(tab.id);
        const lifetimeId = getTabLifetimeId(tab);

        if (!lifetimeId) return;

        const isSet = currentTabLifetimes[lifetimeId] !== undefined;

        if (isSet && tab.active) {
          // If active on window, clear it and return
          currentTabLifetimes = clearTabLifetimes([tab.id], currentTabLifetimes);
          return;
        }
        if (isSet && forceOnSet.has(tab.id)) {
          // clear all tabs in force list
          currentTabLifetimes = clearTabLifetimes([tab.id], currentTabLifetimes);
        }

        if (tabDecayHalfLife <= 0) {
          return;
        }
        // define new lifetime for all unset ids
        currentTabLifetimes = setNewTabLifetime(
          tab,
          currentTabLifetimes,
          tabDecayHalfLife,
          tabDecayExceptions
        );
      });

      // clear lifetimes for tabs that don't exist any more
      // – for example those closed manually
      const nonExistentTabIds = Object.keys(currentTabLifetimes)
        .map(lifetimeId => lifetimeIdToTabId(lifetimeId))
        .filter(tabId => !tabIds.has(tabId));

      if (nonExistentTabIds.length) {
        currentTabLifetimes = clearTabLifetimes(nonExistentTabIds, currentTabLifetimes);
      }

      tabLifetimes.update(() => currentTabLifetimes);
    });
  },
  5000,
  { leading: true, trailing: true }
);

const onActivatedHandler = (info: browser.Tabs.OnActivatedActiveInfoType) => {
  if (info.previousTabId) {
    updateTabLifetimes([info.previousTabId]);
  }
};

const onUpdatedHandler = () => {
  updateTabLifetimes();
};

export default defineBackground(async () => {
  // Executed when background is loaded

  browser.tabs.onActivated.addListener(onActivatedHandler);
  browser.tabs.onUpdated.addListener(onUpdatedHandler);

  onMessage("updatedSettings", () => {
    updateTabLifetimes([], true);
  });
});
