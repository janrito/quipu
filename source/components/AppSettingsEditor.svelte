<script>
import throttle from "lodash/throttle";
import { createEventDispatcher } from "svelte";
import { preventDefault } from "svelte/legacy";

import { clearEntireCache } from "../lib/cache";
import {
  compileURLPattern,
  compileValidURLPatterns,
  findURLPattern,
  formatTimeDelta,
  tryParseJSON,
} from "../lib/utils";
import appSettings from "../stores/app-settings";
import browserTabs from "../stores/browser-tabs";
import IconDelete from "./IconDelete.svelte";
import UITabs from "./UITabs.svelte";

const dispatch = createEventDispatcher(),
  tabs = [
    { id: 0, name: "pinboard" },
    { id: 1, name: "tab decay" },
    { id: 2, name: "raw" },
    { id: 3, name: "cache" },
  ];

let currentTabId = $state(tabs[0].id);

const goToTab = event => {
  currentTabId = Number(event.detail.id);
};

const updateAllAppSettings = throttle(
  async event => {
    const newAppSettings = tryParseJSON(event.target.textContent);
    if (newAppSettings) {
      $appSettings = newAppSettings;
    }
  },
  100,
  { trailing: true }
);

let currentTabDecayHalfLife = $state($appSettings.tabDecayHalfLife);
const updateTabDecayHalfLife = () => {
  $appSettings.tabDecayHalfLife = currentTabDecayHalfLife;
};

const updateTabDecayExemptions = async event => {
  const newTabDecayExemptions = event.target.innerText
    .split("\n")
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        return false;
      }

      return compileURLPattern(trimmed) || trimmed.startsWith("//") ? trimmed : `// ${line}`;
    })
    .filter(line => line)
    .sort();

  if (newTabDecayExemptions) {
    $appSettings = { ...$appSettings, tabDecayExceptions: [...new Set(newTabDecayExemptions)] };
  }
  tabDecayExceptionsEditMode = false;
};

let currentTabDecayExemptions = $state(compileValidURLPatterns($appSettings.tabDecayExceptions));

const liveReloadExceptionMatches = throttle(
  async event => {
    currentTabDecayExemptions = compileValidURLPatterns(event.target.innerText.split("\n"));
  },
  100,
  { trailing: true }
);

const clearCacheHandler = async () => {
  await clearEntireCache();
};

const closeAppSettings = () => {
  dispatch("close");
};

let currentTab = $derived(tabs.find(tab => tab.id === currentTabId));
let tabsMatchingLiveExceptions = $derived(
  $browserTabs
    .map(tab => findURLPattern(tab.url, currentTabDecayExemptions) && tab.url)
    .filter(url => url)
);
</script>

<UITabs {tabs} selectedTabId={currentTabId} on:selectTab={goToTab}>
  <div class="flex h-full flex-col overflow-y-auto overflow-x-hidden pr-3">
    <div class="flex flex-row flex-wrap">
      {#if currentTab.name === "pinboard"}
        <label id="pinboard-api-token" for="pinboardAPIToken" class="mt-5 w-1/2 p-1 pl-7">
          <span>Pinboard API Token</span>
          <input
            class="w-full border-b-2 border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
            type="text"
            name="pinboardAPIToken"
            bind:value={$appSettings.pinboardAPIToken} />

          <p class="text-xs">
            You can find this in your
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://pinboard.in/settings/password">pinboard password settings</a
            >.
          </p>
        </label>
        <label id="pinboard-root-tag" for="pinboardRootTag" class="mt-5 w-1/2 p-1">
          <span>Pinboard Root Tag</span>
          <input
            type="text"
            class="w-full border-b-2 border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
            name="pinboardRootTag"
            bind:value={$appSettings.pinboardRootTag} />
        </label>
      {:else if currentTab.name === "tab decay"}
        <label id="tab-decay-half-life" class="mt-5 w-1/2 p-1 pl-7">
          <span>Half Life </span>
          <input
            class="w-full border-b-2 border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
            type="text"
            name="tabDecayHalfLife"
            onfocusout={updateTabDecayHalfLife}
            bind:value={currentTabDecayHalfLife} />

          <p class="text-xs">
            Rate of decay of a tab –
            {#if currentTabDecayHalfLife > 0}
              {formatTimeDelta(currentTabDecayHalfLife)}
            {:else}
              OFF
            {/if}
          </p>
        </label>
        <div class="mt-5 w-1/2 p-1">
          <label id="tab-decay-exceptions" for="tabDecayExceptions">
            <span>Exceptions</span>

            <pre
              class="h-min-content w-full border-b-2 border-gray-300 bg-gray-100 p-3 text-xs text-gray-800 dark:border-gray-300 dark:bg-gray-900 dark:text-gray-100"
              contenteditable="true"
              onfocusout={updateTabDecayExemptions}
              onkeyup={liveReloadExceptionMatches}
              name="tabDecayExceptions">{$appSettings.tabDecayExceptions.join("\n")}</pre>

            <p class="text-xs">
              New line separated URLPatters to exempt from tab decay e.g. [*://*.google.*/*\?*#*]
            </p>
          </label>
          <p class="mb-1 mt-4 text-sm">Open tabs matching exceptions</p>
          <pre
            class="h-min-content w-full whitespace-pre-wrap border-b-2 border-gray-300 bg-gray-50 p-3 text-xs text-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-500">{tabsMatchingLiveExceptions.join(
              "\n"
            )}</pre>
        </div>
      {:else if currentTab.name === "raw"}
        <label id="all-settings" for="allSettings" class="mt-5 w-full p-1 pl-7">
          <span>All Settings</span>
          <pre
            class="h-min-content w-full border-b-2 border-gray-300 bg-gray-100 p-3 text-xs text-gray-800 dark:border-gray-300 dark:bg-gray-900 dark:text-gray-100"
            contenteditable="true"
            onfocusout={updateAllAppSettings}
            name="allSettings">{JSON.stringify($appSettings, null, " ")}</pre>
        </label>
      {:else if currentTab.name === "cache"}
        <div class="w-full flex-grow">
          <p class="ml-7 mt-5">
            <button
              class="border-b-2 border-red-500 bg-red-200 px-1.5 text-red-500 hover:border-red-200 hover:bg-red-500 hover:text-red-200 dark:border-red-400 dark:bg-red-700 dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-400 dark:hover:text-red-700"
              onclick={preventDefault(clearCacheHandler)}>
              clear cache <span class="inline-block align-text-bottom"><IconDelete /></span>
            </button>
          </p>
        </div>
      {/if}
      <div class="w-3/4"></div>
      <div class="w-1/4 p-1">
        <button
          class="w-full border-b-2 border-gray-500 bg-gray-200 pl-5 pr-1.5 text-left text-gray-500 hover:border-gray-200 hover:bg-gray-500 hover:text-gray-200 dark:border-gray-400 dark:bg-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-400 dark:hover:text-gray-700"
          onclick={preventDefault(closeAppSettings)}>
          done
        </button>
      </div>
    </div>
  </div>
</UITabs>
