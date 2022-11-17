<script>
import { createEventDispatcher } from "svelte";
import throttle from "lodash/throttle";

import UITabs from "./UITabs.svelte";
import IconDelete from "./IconDelete.svelte";
import { clearEntireCache } from "../lib/cache.js";
import { tryParseJSON, formatHalfLife } from "../lib/utils.js";
import settings from "../stores/settings.js";

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
const enableallSettingsEditMode = () => {
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

let tabDecayExceptionsEditMode = false;
const enableTabDecayExceptionsEditMode = () => {
  tabDecayExceptionsEditMode = true;
};

const updateTabDecayExemptions = throttle(
  async event => {
    const newTabDecayExemptions = event.target.innerText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line)
      .sort();

    if (newTabDecayExemptions) {
      $settings = { ...$settings, tabDecayExceptions: [...new Set(newTabDecayExemptions)] };
    }
    tabDecayExceptionsEditMode = false;
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
</script>

<UITabs tabs="{tabs}" selectedTabId="{currentTabId}" on:selectTab="{goToTab}">
  <div class="h-full flex flex-col overflow-y-auto overflow-x-hidden pr-3">
    <div class="flex flex-row flex-wrap">
      {#if currentTab.name === "pinboard"}
        <label id="pinboard-api-token" for="pinboardAPITtoken" class="w-1/2 p-1 pl-7 mt-5">
          <span>Pinboard API Token</span>
          <input
            class="w-full bg-gray-100 border-b-2 border-gray-300"
            type="text"
            name="pinboardAPITtoken"
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
            bind:value="{$settings.tabDecayHalfLife}" />

          <p class="text-xs">
            Rate of decay of a tab. {formatHalfLife($settings.tabDecayHalfLife)}
          </p>
        </label>
        <label id="tab-decay-exceptions" for="tabDecayExceptions" class="w-1/2 p-1 mt-5">
          <span>Exceptions</span>
          {#if tabDecayExceptionsEditMode}
            <pre
              class="w-full h-min-content p-3 bg-gray-100 text-gray-400 border-b-2 border-gray-300 text-xs"
              contenteditable="true"
              role="textbox"
              on:focusout="{updateTabDecayExemptions}"
              name="tabDecayExceptions">{$settings.tabDecayExceptions.join("\n")}</pre>
          {:else}
            <pre
              class="w-full h-min-content p-3 bg-gray-50 text-gray-400 border-b-2 border-gray-300 text-xs "
              on:click="{enableTabDecayExceptionsEditMode}"
              on:keydown="{e => e.key === 'Enter' && enableTabDecayExceptionsEditMode()}"
              name="tabDecayExceptions">{$settings.tabDecayExceptions.join("\n")}</pre>
          {/if}
          <p class="text-xs">
            New line separated exact match or regex patterns for URLs to ignore Tab Decay
          </p>
        </label>
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
              on:click="{enableallSettingsEditMode}"
              on:keydown="{e => e.key === 'Enter' && enableallSettingsEditMode()}"
              name="allSettings">{JSON.stringify($settings, null, "  ")}</pre>
          {/if}
        </label>
      {:else if currentTab.name === "cache"}
        <div class="w-full flex-grow">
          <p class="ml-7 mt-5">
            <button
              class="px-1.5 bg-red-100 border-b-2 text-red-600 border-red-600"
              on:click|preventDefault="{clearCacheHandler}">
              clear cache <IconDelete />
            </button>
          </p>
        </div>
      {/if}
      <div class="w-3/4"></div>
      <div class="w-1/4 p-1">
        <button
          class="bg-gray-200 border-b-2 border-gray-400 pr-1.5 pl-5 w-full text-left"
          on:click|preventDefault="{closeSettings}">
          done
        </button>
      </div>
    </div>
  </div>
</UITabs>
