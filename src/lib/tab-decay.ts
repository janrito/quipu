import { get } from "svelte/store";

import { TAB_QUERY } from "~/lib/constants.js";
import appSettings from "~/lib/stores/app-settings.js";
import decayedTabs from "~/lib/stores/decayed-tabs.js";
import tabLifetimes from "~/lib/stores/tab-lifetimes.js";
import { AppSettingsSchema, tabLifetimesSchema } from "~/lib/types.js";
import {
  calculateDelay,
  closeTab,
  compileValidURLPatterns,
  findURLPattern,
  formatTimeDelta,
  getTabLifetimeId,
  memoizeDebounce,
  sampleLifetime,
} from "~/lib/utils.js";

const decayTab = memoizeDebounce(
  (tabId: number) => {
    browser.tabs.get(tabId).then(async tab => {
      decayedTabs.add(tab).then(() => {
        closeTab(tab);
      });
    });
  },
  100,
  { leading: true, trailing: true },
  // resolver for memoisation uses all provided arguments
  (tabId: number) => `${tabId}`
);

const getTabDecayExceptions = (appSettings: AppSettingsSchema) => {
  const tabDecayExceptions = appSettings.tabDecayExceptions;
  return compileValidURLPatterns(tabDecayExceptions);
};
const getTabLifetime = (
  tab: Browser.tabs.Tab,
  lifetimeId: string,
  currentTabLifetimes: tabLifetimesSchema,
  tabDecayExceptions: URLPattern[],
  tabDecayHalfLife: number,
  forceNewLifetime: boolean = false
) => {
  // ignore active tab, pinned tabs and explicitly excluded URLs
  if (tab.active || tab.pinned || findURLPattern(tab.url || "", tabDecayExceptions))
    return undefined;

  // get the current lifetime for the tab
  let lifetime = currentTabLifetimes[lifetimeId];

  // if lifetime is not set, or if forceNewLifetime is true, set a new lifetime
  if (!lifetime || forceNewLifetime) {
    lifetime = sampleLifetime(tabDecayHalfLife);
  }

  return lifetime;
};

const decayIfLifetimeExpired = (tab: Browser.tabs.Tab, lifetime: number) => {
  const timeToDeath = calculateDelay(lifetime, tab.lastAccessed);
  if (timeToDeath <= 0 && tab.id) {
    // if the time to death is less than 0, decay the tab
    console.warn(
      `Tab ${tab.id} decayed after a lifetime of ${formatTimeDelta(lifetime)}: ${tab.url}`
    );
    decayTab(tab.id);
    return true;
  }
  return false;
};

export const updateTabLifetimes = async (forceOn: number[] = [], forceOnAll: boolean = false) => {
  const forceOnSet = new Set(forceOn);

  await appSettings.read();
  const currentAppSettings = get(appSettings);
  const tabDecayHalfLife = currentAppSettings.tabDecayHalfLife;
  const tabDecayExceptions = getTabDecayExceptions(currentAppSettings);

  tabLifetimes.update(async currentTabLifetimes => {
    const newTabLifetimes: tabLifetimesSchema = {};
    await browser.tabs.query(TAB_QUERY).then(tabs => {
      tabs.map(tab => {
        // ignore tabs without ID
        if (!tab.id) return;

        // get the lifetime ID for the tab
        const lifetimeId = getTabLifetimeId(tab);
        // ignore tabs without lifetime ID
        if (!lifetimeId) return;

        // keep track of all existing tabs
        const lifetime = getTabLifetime(
          tab,
          lifetimeId,
          currentTabLifetimes,
          tabDecayExceptions,
          tabDecayHalfLife,
          forceOnSet.has(tab.id) || forceOnAll
        );

        if (!lifetime) return;

        if (!decayIfLifetimeExpired(tab, lifetime)) {
          newTabLifetimes[lifetimeId] = lifetime;
        }
      });
    });
    return newTabLifetimes;
  });
};
