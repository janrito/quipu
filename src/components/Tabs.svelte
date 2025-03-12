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

onMount(() => {
  setTimeout(() => {
    tabLifetimes.sync();
    setInterval(() => {
      tabLifetimes.sync();
    }, UPDATE_DECAY_DISPLAY_INTERVAL);
  }, 500);
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

<div class="h-full overflow-x-hidden overflow-y-auto pr-3">
  {#each $browserTabs as tabs, windowIndex (windowIndex)}
    <h3 class="pl-5 text-sm font-extralight">
      {#if windowIndex === 0}Current
      {/if}Window Tabs
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
  {/each}
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
