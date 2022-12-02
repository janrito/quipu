import debounce from "lodash/debounce";
import { get } from "svelte/store";
import browser from "webextension-polyfill";

import { MAX_DELAY_TO_SCHEDULE, TAB_QUERY, UPDATED_SETTINGS_EVENT } from "./lib/constants";
import "./lib/options-storage.js";
import { closeTab, compileValidURLPatterns, findURLPattern, sampleLifetime } from "./lib/utils.js";
import decayedTabs from "./stores/decayed-tabs";
import settings from "./stores/settings";
import tabLifetimes from "./stores/tab-lifetimes";

const decayTab = debounce(tabId => {
  browser.tabs.get(tabId).then(tab => {
    decayedTabs.add(tab);
    closeTab(tabId);
    tabLifetimes.update(currentTabLifetimes => {
      if (currentTabLifetimes[tabId]) {
        delete currentTabLifetimes[tabId];
      }
      return currentTabLifetimes;
    });
  });
}, 100);

const clearTabLifetimes = (tabIds, currentTabLifetimes) => {
  const tabIdsSet = new Set(tabIds);
  tabIdsSet.forEach(tabId => {
    const { timerId } = currentTabLifetimes[tabId];
    clearTimeout(timerId);
  });
  return Object.fromEntries(Object.entries(currentTabLifetimes).filter(key => !tabIdsSet.has(key)));
};

const setNewTabLifetime = (tab, currentTabLifetimes, { tabDecayExceptions, tabDecayHalfLife }) => {
  const matchingExceptionPattern = findURLPattern(tab.url, tabDecayExceptions);

  if (tab.pinned || matchingExceptionPattern) {
    return currentTabLifetimes;
  }
  const now = new Date().valueOf();
  const lastAccessed = tab.lastAccessed.valueOf();
  const { lifetime } = currentTabLifetimes[tab.id] || {
    lifetime: sampleLifetime(tabDecayHalfLife),
  };
  const currentLifeSpan = now - lastAccessed;
  const delay = lifetime - currentLifeSpan > 0 ? lifetime - currentLifeSpan : 0;

  if (delay > MAX_DELAY_TO_SCHEDULE) {
    // only set the decay timer on tabs that are likely to decay soon.
    return currentTabLifetimes;
  }
  const timerId = setTimeout(decayTab, delay, tab.id);
  currentTabLifetimes[tab.id] = { timerId, lifetime };
  return currentTabLifetimes;
};

const updateTabLifetimes = debounce(async (forceOn = [], forceOnAll = false) => {
  await settings.read();
  const currentSettings = get(settings);
  const tabDecayHalfLife = currentSettings.tabDecayHalfLife;
  const tabDecayExceptions = compileValidURLPatterns(currentSettings.tabDecayExceptions);
  const forceOnSet = new Set(forceOn);

  let currentTabLifetimes = get(tabLifetimes);

  browser.tabs.query(TAB_QUERY).then(tabs => {
    const tabIds = new Set([]);
    tabs.map(tab => {
      // keep track of all existing tabs
      tabIds.add(tab.id);

      const isSet = currentTabLifetimes[tab.id] !== undefined;

      if (isSet && tab.active) {
        // If active on window, clear it and return
        currentTabLifetimes = clearTabLifetimes([tab.id], currentTabLifetimes);
        return;
      }

      if (isSet && (forceOnSet.has(tab.id) || forceOnAll)) {
        // clear all tabs in force list
        currentTabLifetimes = clearTabLifetimes([tab.id], currentTabLifetimes);
      }

      if (tabDecayHalfLife <= 0) {
        return;
      }
      // define new lifetime for all unset ids
      currentTabLifetimes = setNewTabLifetime(tab, currentTabLifetimes, {
        tabDecayHalfLife,
        tabDecayExceptions,
      });
    });

    // clear lifetimes for tabs that don't exist any more
    // – for example those closed manually
    currentTabLifetimes = clearTabLifetimes(
      Object.keys(currentTabLifetimes).filter(tabId => !tabIds.has(Number(tabId))),
      currentTabLifetimes
    );

    tabLifetimes.update(() => currentTabLifetimes);
  });
}, 5000);

const onActivatedHandler = ({ previousTabId }) => {
  updateTabLifetimes([previousTabId]);
};

browser.tabs.onActivated.addListener(onActivatedHandler);

const onUpdatedHandler = () => {
  updateTabLifetimes();
};
browser.tabs.onUpdated.addListener(onUpdatedHandler);

const messageHandler = async request => {
  if (request.event && request.event === UPDATED_SETTINGS_EVENT) {
    // renew lifetimes for every tab
    updateTabLifetimes([], true);
  }
};

browser.runtime.onMessage.addListener(messageHandler);
