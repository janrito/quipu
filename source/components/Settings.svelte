<script>
import { createEventDispatcher } from "svelte";
import throttle from "lodash/throttle";

import UITabs from "./UITabs.svelte";
import IconDelete from "./IconDelete.svelte";
import { clearEntireCache } from "../lib/cache.js";
import { tryParseJSON } from "../lib/utils.js";
import settings from "../stores/settings.js";

const dispatch = createEventDispatcher(),
  tabs = [
    { id: 0, name: "pinboard" },
    { id: 1, name: "raw" },
    { id: 2, name: "cache" },
  ];

let currentTabId = tabs[0].id;

const goToTab = event => {
  currentTabId = Number(event.detail.id);
};

const updateAllSettings = throttle(
  async event => {
    const newSettings = tryParseJSON(event.target.textContent);
    if (newSettings) {
      $settings = newSettings;
    }
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
        <label id="pinboard-api-token" class="w-1/2 p-1 pl-7 mt-5">
          <span>Pinboard API Token</span>
          <input
            class="w-full bg-gray-100 border-b-2 border-gray-300"
            type="text"
            name="pinboardAPITtoken"
            bind:value="{$settings.pinboardAPIToken}" />

          <p class="text-xs">
            You can find this in your
            <a target="_blank" href="https://pinboard.in/settings/password"
              >pinboard password settings</a
            >.
          </p>
        </label>
        <label id="pinboard-root-tag" class="w-1/2 p-1 mt-5">
          <span>Pinboard Root Tag</span>
          <input
            type="text"
            class="w-full bg-gray-100 border-b-2 border-gray-300"
            name="pinboardRootTag"
            bind:value="{$settings.pinboardRootTag}" />
        </label>
      {:else if currentTab.name === "raw"}
        <div class="w-full flex-grow">
          <pre
            on:keyup="{updateAllSettings}"
            contenteditable="true"
            class="w-full h-full ml-7 p-3 bg-gray-50 text-gray-400 text-xs ">{JSON.stringify(
              $settings,
              null,
              "  "
            )}</pre>
        </div>
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
