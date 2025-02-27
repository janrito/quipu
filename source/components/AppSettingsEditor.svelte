<script lang="ts">
import { throttle } from "lodash";

import { clearEntireCache } from "../lib/cache.js";
import {
  compileURLPattern,
  compileValidURLPatterns,
  findURLPattern,
  formatTimeDelta,
  tryParseJSONSettings,
} from "../lib/utils.js";
import appSettings from "../stores/app-settings.js";
import browserTabs from "../stores/browser-tabs.js";
import IconDelete from "./IconDelete.svelte";
import UITabs from "./UITabs.svelte";

interface Props {
  closeEditor: () => void;
}

let { closeEditor }: Props = $props();

const tabs = ["pinboard", "tab decay", "raw", "cache"];

let currentTabDecayHalfLife = $state($appSettings.tabDecayHalfLife);

let currentTab = $state(tabs[0]);
let tabsMatchingLiveExceptions = $derived(
  $browserTabs
    .flat()
    .map(tab =>
      tab.href ? findURLPattern(tab.href, currentTabDecayExemptions) && tab.href : undefined
    )
    .filter(url => url)
);

const updateAllAppSettings = throttle(
  async (event: Event) => {
    if (!event.target || !(event.target instanceof HTMLElement)) {
      return;
    }
    const newAppSettings = tryParseJSONSettings(event.target.textContent || "");
    if (newAppSettings) {
      $appSettings = newAppSettings;
    }
  },
  100,
  { trailing: true }
);

const updateTabDecayHalfLife = () => {
  $appSettings.tabDecayHalfLife = currentTabDecayHalfLife;
};

const updateTabDecayExemptions = async (event: Event) => {
  if (!event.target || !(event.target instanceof HTMLElement)) {
    return;
  }
  const newTabDecayExemptions = event.target.innerText
    .split("\n")
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      const compiledURLPattern = compileURLPattern(trimmed);

      // return compiled pattern if it is valid
      if (compiledURLPattern) return String(compiledURLPattern);

      // return commented line if it is invalid
      return trimmed.startsWith("// ") ? trimmed : `// INVALID: ${line}`;
    })
    .filter(line => line)
    .sort();

  if (newTabDecayExemptions) {
    $appSettings = { ...$appSettings, tabDecayExceptions: [...new Set(newTabDecayExemptions)] };
  }
};

let currentTabDecayExemptions = $state(compileValidURLPatterns($appSettings.tabDecayExceptions));

const liveReloadExceptionMatches = throttle(
  async (event: Event) => {
    if (!event.target || !(event.target instanceof HTMLElement)) {
      return;
    }
    currentTabDecayExemptions = compileValidURLPatterns(event.target.innerText.split("\n"));
  },
  100,
  { trailing: true }
);

const clearCacheHandler = async (event: Event) => {
  event.preventDefault();
  await clearEntireCache();
};
const handleCloseEditor = (event: Event) => {
  event.preventDefault();
  closeEditor();
};
</script>

<UITabs {tabs} bind:selectedTab={currentTab}>
  <div class="flex h-full flex-col overflow-x-hidden overflow-y-auto pr-3">
    <div class="flex flex-row flex-wrap">
      {#if currentTab === "pinboard"}
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
      {:else if currentTab === "tab decay"}
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
              id="tabDecayExceptions">{$appSettings.tabDecayExceptions.join("\n")}</pre>

            <p class="text-xs">
              New line separated URLPatters to exempt from tab decay e.g. [*://*.google.*/*\?*#*]
            </p>
          </label>
          <p class="mt-4 mb-1 text-sm">Open tabs matching exceptions</p>
          <pre
            class="h-min-content w-full border-b-2 border-gray-300 bg-gray-50 p-3 text-xs whitespace-pre-wrap text-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-500">{tabsMatchingLiveExceptions.join(
              "\n"
            )}</pre>
        </div>
      {:else if currentTab === "raw"}
        <label id="all-settings" for="allSettings" class="mt-5 w-full p-1 pl-7">
          <span>All Settings</span>
          <pre
            class="h-min-content w-full border-b-2 border-gray-300 bg-gray-100 p-3 text-xs text-gray-800 dark:border-gray-300 dark:bg-gray-900 dark:text-gray-100"
            contenteditable="true"
            onfocusout={updateAllAppSettings}
            id="allSettings">{JSON.stringify($appSettings, null, " ")}</pre>
        </label>
      {:else if currentTab === "cache"}
        <div class="w-full flex-grow">
          <p class="mt-5 ml-7">
            <button
              class="border-b-2 border-red-500 bg-red-200 px-1.5 text-red-500 hover:border-red-200 hover:bg-red-500 hover:text-red-200 dark:border-red-400 dark:bg-red-700 dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-400 dark:hover:text-red-700"
              onclick={clearCacheHandler}>
              clear cache <span class="inline-block align-text-bottom"><IconDelete /></span>
            </button>
          </p>
        </div>
      {/if}
      <div class="w-3/4"></div>
      <div class="w-1/4 p-1">
        <button
          class="w-full border-b-2 border-gray-500 bg-gray-200 pr-1.5 pl-5 text-left text-gray-500 hover:border-gray-200 hover:bg-gray-500 hover:text-gray-200 dark:border-gray-400 dark:bg-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-400 dark:hover:text-gray-700"
          onclick={handleCloseEditor}>
          done
        </button>
      </div>
    </div>
  </div>
</UITabs>
