import debounce from "lodash/debounce";
import { get } from "svelte/store";
import { URLPattern } from "urlpattern-polyfill";
import browser from "webextension-polyfill";

import { MAX_DELAY_TO_SCHEDULE, TAB_QUERY, UPDATED_SETTINGS_EVENT } from "./lib/constants";

import "./lib/options-storage";

import { AppSettingsSchema, BrowserMessage, tabLifetimesSchema } from "./lib/types";
import {
  calculateDelay,
  closeTab,
  compileValidURLPatterns,
  findURLPattern,
  isBrowserMessage,
  lifetimeIdToTabId,
  sampleLifetime,
  tabIdToLifetimeId,
} from "./lib/utils";
import appSettings from "./stores/app-settings";
import decayedTabs from "./stores/decayed-tabs";
import tabLifetimes from "./stores/tab-lifetimes";

const decayTab = debounce(tabId => {
  browser.tabs.get(tabId).then(tab => {
    decayedTabs.add(tab);
    closeTab(tabId);
    tabLifetimes.update(currentTabLifetimes => {
      const lifetimeId = tabIdToLifetimeId(tabId);
      if (currentTabLifetimes[lifetimeId]) {
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

  const lifetimeId = tabIdToLifetimeId(tab.id);
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
        const lifetimeId = tabIdToLifetimeId(tab.id);

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

browser.tabs.onActivated.addListener(onActivatedHandler);

const onUpdatedHandler = () => {
  updateTabLifetimes();
};
browser.tabs.onUpdated.addListener(onUpdatedHandler);

const messageHandler = async (message: BrowserMessage | unknown) => {
  if (isBrowserMessage(message)) {
    switch (message.eventType) {
      case UPDATED_SETTINGS_EVENT:
        updateTabLifetimes([], true);
    }
  }
};

browser.runtime.onMessage.addListener(messageHandler);
