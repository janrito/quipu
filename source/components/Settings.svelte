<script>
import { createEventDispatcher } from "svelte";
import throttle from "lodash/throttle";

import { clearEntireCache } from "../lib/cache";
import {
  compileURLPattern,
  compileValidURLPatterns,
  findURLPattern,
  formatTimeDelta,
  tryParseJSON,
} from "../lib/utils";
import browserTabs from "../stores/browser-tabs";
import settings from "../stores/settings";
import IconDelete from "./IconDelete.svelte";
import UITabs from "./UITabs.svelte";

const dispatch = createEventDispatcher(),
  tabs = [
    { id: 0, name: "pinboard" },
    { id: 1, name: "tab decay" },
    { id: 2, name: "raw" },
    { id: 3, name: "cache" },
  ];

let currentTabId = tabs[0].id;

const goToTab = event => {
  currentTabId = Number(event.detail.id);
};
let allSettingsEditMode = false;
const enableAllSettingsEditMode = () => {
  allSettingsEditMode = true;
};

const updateAllSettings = throttle(
  async event => {
    const newSettings = tryParseJSON(event.target.textContent);
    if (newSettings) {
      $settings = newSettings;
    }
    allSettingsEditMode = false;
  },
  100,
  { trailing: true }
);

let currentTabDecayHalfLife = $settings.tabDecayHalfLife;
const updateTabDecayHalfLife = () => {
  $settings.tabDecayHalfLife = currentTabDecayHalfLife;
};
let tabDecayExceptionsEditMode = false;
const enableTabDecayExceptionsEditMode = () => {
  tabDecayExceptionsEditMode = true;
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
    $settings = { ...$settings, tabDecayExceptions: [...new Set(newTabDecayExemptions)] };
  }
  tabDecayExceptionsEditMode = false;
};

let currentTabDecayExemptions = compileValidURLPatterns($settings.tabDecayExceptions);

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

const closeSettings = () => {
  dispatch("close");
};

$: currentTab = tabs.find(tab => tab.id === currentTabId);
$: tabsMatchingLiveExceptions = $browserTabs
  .map(tab => findURLPattern(tab.url, currentTabDecayExemptions) && tab.url)
  .filter(url => url);
</script>

<UITabs tabs="{tabs}" selectedTabId="{currentTabId}" on:selectTab="{goToTab}">
  <div class="h-full flex flex-col overflow-y-auto overflow-x-hidden pr-3">
    <div class="flex flex-row flex-wrap">
      {#if currentTab.name === "pinboard"}
        <label id="pinboard-api-token" for="pinboardAPIToken" class="w-1/2 p-1 pl-7 mt-5">
          <span>Pinboard API Token</span>
          <input
            class="w-full bg-gray-100 border-b-2 border-gray-300"
            type="text"
            name="pinboardAPIToken"
            bind:value="{$settings.pinboardAPIToken}" />

          <p class="text-xs">
            You can find this in your
            <a target="_blank" href="https://pinboard.in/settings/password" rel="noreferrer"
              >pinboard password settings</a
            >.
          </p>
        </label>
        <label id="pinboard-root-tag" for="pinboardRootTag" class="w-1/2 p-1 mt-5">
          <span>Pinboard Root Tag</span>
          <input
            type="text"
            class="w-full bg-gray-100 border-b-2 border-gray-300"
            name="pinboardRootTag"
            bind:value="{$settings.pinboardRootTag}" />
        </label>
      {:else if currentTab.name === "tab decay"}
        <label id="tab-decay-half-life" class="w-1/2 p-1 pl-7 mt-5">
          <span>Half Life </span>
          <input
            class="w-full bg-gray-100 border-b-2 border-gray-300"
            type="text"
            name="tabDecayHalfLife"
            on:focusout="{updateTabDecayHalfLife}"
            bind:value="{currentTabDecayHalfLife}" />

          <p class="text-xs">
            Rate of decay of a tab –
            {#if currentTabDecayHalfLife > 0}
              {formatTimeDelta(currentTabDecayHalfLife)}
            {:else}
              OFF
            {/if}
          </p>
        </label>
        <div class="w-1/2 p-1 mt-5">
          <label id="tab-decay-exceptions" for="tabDecayExceptions">
            <span>Exceptions</span>
            {#if tabDecayExceptionsEditMode}
              <pre
                class="w-full h-min-content p-3 bg-gray-100 text-gray-400 border-b-2 border-gray-300 text-xs"
                contenteditable="true"
                role="textbox"
                on:focusout="{updateTabDecayExemptions}"
                on:keyup="{liveReloadExceptionMatches}"
                name="tabDecayExceptions">{$settings.tabDecayExceptions.join("\n")}</pre>
            {:else}
              <pre
                class="w-full h-min-content p-3 bg-gray-50 text-gray-400 border-b-2 border-gray-300 text-xs"
                on:click="{enableTabDecayExceptionsEditMode}"
                on:keydown="{e => e.key === 'Enter' && enableTabDecayExceptionsEditMode()}"
                name="tabDecayExceptions">{$settings.tabDecayExceptions.join("\n")}</pre>
            {/if}
            <p class="text-xs">
              New line separated URLPatters to exempt from tab decay e.g. [*://*.google.*/*\?*#*]
            </p>
          </label>
          <p class="text-sm mt-4 mb-1 ">Open tabs matching exceptions</p>
          <pre
            class="w-full h-min-content p-3 bg-gray-50 text-gray-400 border-b-2 border-gray-300 text-xs whitespace-pre-wrap">{tabsMatchingLiveExceptions.join(
              "\n"
            )}</pre>
        </div>
      {:else if currentTab.name === "raw"}
        <label id="all-settings" for="allSettings" class="w-full p-1 pl-7 mt-5">
          <span>All Settings</span>
          {#if allSettingsEditMode}
            <pre
              class="w-full h-min-content p-3 bg-gray-100 text-gray-400 border-b-2 border-gray-300 text-xs"
              contenteditable="true"
              role="textbox"
              on:focusout="{updateAllSettings}"
              name="allSettings">{JSON.stringify($settings, null, "  ")}</pre>
          {:else}
            <pre
              class="w-full h-min-content p-3 bg-gray-50 text-gray-400 border-b-2 border-gray-300 text-xs "
              on:click="{enableAllSettingsEditMode}"
              on:keydown="{e => e.key === 'Enter' && enableAllSettingsEditMode()}"
              name="allSettings">{JSON.stringify($settings, null, "  ")}</pre>
          {/if}
        </label>
      {:else if currentTab.name === "cache"}
        <div class="w-full flex-grow">
          <p class="ml-7 mt-5">
            <button
              class="px-1.5 border-b-2 bg-red-200 hover:bg-red-500 border-red-500 hover:border-red-200 text-red-500 hover:text-red-200"
              on:click|preventDefault="{clearCacheHandler}">
              clear cache <span class="inline-block align-text-bottom"><IconDelete /></span>
            </button>
          </p>
        </div>
      {/if}
      <div class="w-3/4"></div>
      <div class="w-1/4 p-1">
        <button
          class="pr-1.5 pl-5 w-full text-left border-b-2 bg-gray-200 hover:bg-gray-500 border-gray-500 hover:border-gray-200 text-gray-500 hover:text-gray-200"
          on:click|preventDefault="{closeSettings}">
          done
        </button>
      </div>
    </div>
  </div>
</UITabs>
