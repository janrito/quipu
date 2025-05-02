import { Tabs } from "webextension-polyfill";
import { browser } from "wxt/browser";

import { onMessage } from "~/lib/messaging";
import { updateTabLifetimes } from "~/lib/tab-decay.js";
import { memoizeDebounce } from "~/lib/utils.js";

const debouncedUpdateTabLifetimes = memoizeDebounce(
  updateTabLifetimes,
  5000,
  { leading: true, trailing: true },
  // resolver for memoisation uses all provided arguments
  (forceOn: number[] = [], forceOnAll: boolean = false) =>
    `${forceOnAll}|${[...forceOn].sort().join("|")}`
);

const onActivatedHandler = (info: Tabs.OnActivatedActiveInfoType) => {
  if (info.previousTabId) {
    debouncedUpdateTabLifetimes([info.previousTabId]);
  }
};

const onUpdatedHandler = () => {
  debouncedUpdateTabLifetimes();
};

const onAlarmHandler = (alarm: Browser.alarms.Alarm) => {
  if (alarm.name === "updateTabLifetimes") {
    debouncedUpdateTabLifetimes();
  }
};

const onUpdatedSettingsHandler = () => {
  debouncedUpdateTabLifetimes([], true);
};

export default defineBackground(async () => {
  // Executed when background is loaded

  browser.tabs.onActivated.addListener(onActivatedHandler);
  browser.tabs.onUpdated.addListener(onUpdatedHandler);

  browser.alarms.create("updateTabLifetimes", { delayInMinutes: 0.1, periodInMinutes: 0.1 });
  browser.alarms.onAlarm.addListener(onAlarmHandler);
  onMessage("updatedSettings", onUpdatedSettingsHandler);
});
