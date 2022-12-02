import { get } from "svelte/store";
import browser from "webextension-polyfill";

import { MAX_DELAY_TO_SCHEDULE, TAB_QUERY, UPDATED_SETTINGS_EVENT } from "./lib/constants";
import "./lib/options-storage.js";
import { closeTab, compileValidURLPatterns, findURLPattern, sampleLifetime } from "./lib/utils.js";
import decayedTabs from "./stores/decayed-tabs";
import settings from "./stores/settings";

const tabLifetimes = {};

const decayTab = tabId => {
  browser.tabs.get(tabId).then(tab => {
    decayedTabs.add(tab);
    closeTab(tabId);
  });
};

const clearTabLifetime = tabId => {
  const { timerId } = tabLifetimes[tabId];
  clearTimeout(timerId);
  delete tabLifetimes[tabId];
};

const setNewTabLifetime = ({ tab, tabDecayExceptions, tabDecayHalfLife }) => {
  const matchingExceptionPattern = findURLPattern(tab.url, tabDecayExceptions);

  if (tab.pinned || matchingExceptionPattern) {
    return;
  }
  const now = new Date().valueOf();
  const lastAccessed = tab.lastAccessed.valueOf();
  const { lifetime } = tabLifetimes[tab.id] || { lifetime: sampleLifetime(tabDecayHalfLife) };
  const currentLifeSpan = now - lastAccessed;
  const delay = lifetime - currentLifeSpan > 0 ? lifetime - currentLifeSpan : 0;

  if (delay > MAX_DELAY_TO_SCHEDULE) {
    // only set the decay timer on tabs that are likely to decay soon.
    return;
  }
  const timerId = setTimeout(decayTab, delay, tab.id);
  tabLifetimes[tab.id] = { timerId, lifetime };
};

const updateTabLifetimes = async (forceOn = [], forceOnAll = false) => {
  await settings.read();
  const currentSettings = get(settings);
  const tabDecayHalfLife = currentSettings.tabDecayHalfLife;
  const tabDecayExceptions = compileValidURLPatterns(currentSettings.tabDecayExceptions);

  const forceOnSet = new Set(forceOn);

  browser.tabs.query(TAB_QUERY).then(tabs =>
    tabs.map(tab => {
      const isSet = tabLifetimes[tab.id] !== undefined;

      if (isSet && tab.active) {
        // If active on window, clear it and return
        clearTabLifetime(tab.id);
        return tab;
      }

      if (isSet && (forceOnSet.has(tab.id) || forceOnAll)) {
        // clear all tabs in force list
        clearTabLifetime(tab.id);
      }

      if (tabDecayHalfLife > 0) {
        // define new lifetime for all unset ids
        setNewTabLifetime({ tab, tabDecayHalfLife, tabDecayExceptions });
      }
      return tab;
    });
};

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
