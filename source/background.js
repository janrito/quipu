import { get } from "svelte/store";
import browser from "webextension-polyfill";

import { TAB_QUERY } from "./lib/constants";
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

const setNewTabLifetime = ({ tab, tabDecayExceptions, tabDecayHalfLife }) => {
  const matchingExceptionPattern = findURLPattern(tab.url, tabDecayExceptions);

  if (tab.pinned || matchingExceptionPattern) {
    return undefined;
  }
  const now = new Date().valueOf();
  const lastAccessed = tab.lastAccessed.valueOf();

  const lifetime = sampleLifetime(tabDecayHalfLife);
  const currentLifeSpan = now - lastAccessed;
  const delay = lifetime - currentLifeSpan > 0 ? lifetime - currentLifeSpan : 0;
  const timerId = setTimeout(decayTab, delay, tab.id);
  return { timerId, lifetime };
};

const onActiveTabChanged = async ({ previousTabId, tabId }) => {
  await settings.read();
  const currentSettings = get(settings);
  const tabDecayHalfLife = currentSettings.tabDecayHalfLife;
  const tabDecayExceptions = compileValidURLPatterns(currentSettings.tabDecayExceptions);

  browser.tabs.query(TAB_QUERY).then(tabs =>
    tabs.map(tab => {
      const tabLifetime = tabLifetimes[tab.id];
      if (tabLifetime === undefined) {
        // if no lifetime exists set one
        // except the active one
        if (tabId !== tab.id) {
          tabLifetimes[tab.id] = setNewTabLifetime({ tab, tabDecayHalfLife, tabDecayExceptions });
        }
        return;
      }

      if (tabId === tab.id) {
        //  If lifetime exists for current tab, clear it

        clearTimeout(tabLifetime.timerId);
        delete tabLifetimes[tabId];
      } else if (previousTabId === tab.id) {
        // If lifetime exists for recently deactivated tab, clear it and set a new one.

        clearTimeout(tabLifetime.timerId);
        tabLifetimes[tab.id] = setNewTabLifetime({ tab, tabDecayHalfLife, tabDecayExceptions });
      }
    })
  );
};

browser.tabs.onActivated.addListener(onActiveTabChanged);
