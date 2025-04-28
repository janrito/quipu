<script lang="ts">
import { onMount } from "svelte";

import { UPDATE_DECAY_DISPLAY_INTERVAL } from "~/lib/constants.js";
import browserTabs from "~/lib/stores/browser-tabs.js";
import decayedTabs from "~/lib/stores/decayed-tabs.js";
import tabLifetimes from "~/lib/stores/tab-lifetimes.js";
import type { TabBookmarkSchema, tabLifetimesSchema } from "~/lib/types.js";
import {
  calculateDelay,
  closeTab,
  getTabLifetimeId,
  newTab,
  switchToTab,
  switchToWindow,
} from "~/lib/utils.js";

import Bookmark from "./Bookmark.svelte";

let currentWindowId: Number | null = $state(null);

onMount(async () => {
  setTimeout(() => {
    tabLifetimes.sync();
    setInterval(() => {
      tabLifetimes.sync();
    }, UPDATE_DECAY_DISPLAY_INTERVAL);
  }, 500);

  currentWindowId = (await browser.windows.getCurrent())?.id || null;
});

const getTabLifetime = (tab: TabBookmarkSchema, lifetimes: tabLifetimesSchema) => {
  const lifetimeId = getTabLifetimeId(tab);
  const tabLifetimeMeta = (lifetimeId && lifetimes[lifetimeId]) || {
    lifetime: undefined,
  };
  const { lifetime } = tabLifetimeMeta;
  return lifetime;
};

const calculateDecay = (tab: TabBookmarkSchema, lifetime: number) => {
  const delay = calculateDelay(lifetime, tab.lastAccessed);
  return 1 - delay / lifetime;
};
</script>

<div class="flex h-full flex-col justify-between overflow-x-hidden overflow-y-auto">
  {#each $browserTabs.entries() as [windowId, tabs], windowIndex}
    {#if tabs && tabs.length}
      <div
        class={[
          "w-full bg-gray-100 p-2 pr-3 dark:bg-gray-800",
          // last window should expand to fill space
          windowIndex + 1 === $browserTabs.size && "flex-grow",
        ]}>
        <h3 class="pl-5 text-sm font-extralight">
          {#if currentWindowId === windowId}
            Current
          {/if} Window Tabs
          <span class="text-gray-300 dark:text-gray-600">({tabs.length})</span>
        </h3>
        {#each tabs as tab (tab.id)}
          {@const lifetime = getTabLifetime(tab, $tabLifetimes)}
          <Bookmark
            bookmark={tab}
            {...lifetime ? { decay: calculateDecay(tab, lifetime) } : {}}
            openBookmark={() => {
              switchToWindow(tab);
              switchToTab(tab);
            }}
            closeBookmark={() => closeTab(tab)} />
        {/each}
      </div>
    {/if}
  {/each}
  {#if $decayedTabs && $decayedTabs.length}
    <div class="w-full bg-gray-200 p-2 pr-3 dark:bg-gray-700">
      <h3 class="mt-3 pl-5 text-sm font-extralight">
        Decayed Tabs <span class="text-gray-300 dark:text-gray-600">({$decayedTabs.length})</span>
      </h3>

      {#each $decayedTabs as decayedTab (decayedTab.id)}
        <Bookmark
          bookmark={decayedTab}
          closeEnabled={false}
          openBookmark={() => newTab(decayedTab.href)} />
      {/each}
    </div>
  {/if}
</div>
