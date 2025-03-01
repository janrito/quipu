<script lang="ts">
import { onMount } from "svelte";
import type { DndEvent } from "svelte-dnd-action";
import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME, TRIGGERS } from "svelte-dnd-action";
import { run } from "svelte/legacy";

import { UPDATE_DECAY_DISPLAY_INTERVAL } from "~/lib/constants.js";
import browserTabs from "~/lib/stores/browser-tabs.js";
import decayedTabs from "~/lib/stores/decayed-tabs.js";
import tabLifetimes from "~/lib/stores/tab-lifetimes.js";
import type {
  DraggableBookmarkSchema,
  TabBookmarkSchema,
  tabLifetimesSchema,
} from "~/lib/types.js";
import {
  calculateDelay,
  closeTab,
  modifyElementClasses,
  newTab,
  randomSuffix,
  switchToTab,
  switchToWindow,
  tabIdToLifetimeId,
} from "~/lib/utils.js";

import Bookmark from "./Bookmark.svelte";

// keep track of temporary tabs, when one is being dragged
let tempBrowserTabs: (DraggableBookmarkSchema & TabBookmarkSchema)[][] = $state([]);
let tempDecayedTabs: DraggableBookmarkSchema[] = $state([]);

// keep track of active tab lifetimes
let updatedLifetimes = $state($tabLifetimes);

let drawingWindowTabs = $derived(tempBrowserTabs.length ? tempBrowserTabs : [...$browserTabs]);
let drawingDecayedTabs = $derived(
  tempDecayedTabs.length ? tempDecayedTabs : ([...$decayedTabs] as DraggableBookmarkSchema[])
);

onMount(() => {
  setTimeout(() => {
    tabLifetimes.sync();
    setInterval(() => {
      tabLifetimes.sync();
    }, UPDATE_DECAY_DISPLAY_INTERVAL);
  }, 500);
});

const handleDragTab = () => {
  tempBrowserTabs = [];
};

const handleDragDecayedTab = () => {
  tempDecayedTabs = [];
};

const getTabLifetime = (tab: TabBookmarkSchema, updatedLifetimes: tabLifetimesSchema) => {
  const tabLifetimeMeta = updatedLifetimes[tabIdToLifetimeId(tab._id)] || { lifetime: undefined };
  const { lifetime } = tabLifetimeMeta;
  return lifetime;
};

const calculateDecay = (tab: TabBookmarkSchema, lifetime: number) => {
  const delay = calculateDelay(lifetime, tab.lastAccessed);
  return 1 - delay / lifetime;
};

const handleDragTabConsider =
  (windowIndex: number) => (event: CustomEvent<DndEvent<DraggableBookmarkSchema>>) => {
    const { trigger, id } = event.detail.info;
    const localTabs = $browserTabs[windowIndex];
    // find index of dragged tab in the browser tabs store
    const draggedTabInStoreIdx = localTabs.findIndex(b => b.id === id);

    if (draggedTabInStoreIdx >= 0 && trigger === TRIGGERS.DRAG_STARTED) {
      event.detail.items = event.detail.items.filter(b => !b[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
      event.detail.items.splice(draggedTabInStoreIdx, 0, {
        // duplicate tab with fake id temporarily
        ...localTabs[draggedTabInStoreIdx],
        id: `${id}-${randomSuffix()}`,
      });
      tempBrowserTabs = [
        ...$browserTabs.slice(0, windowIndex),
        event.detail.items as TabBookmarkSchema[],
        ...$browserTabs.slice(windowIndex + 1),
      ];
    } else if (
      trigger === TRIGGERS.DROPPED_INTO_ANOTHER ||
      trigger === TRIGGERS.DROPPED_OUTSIDE_OF_ANY ||
      trigger === TRIGGERS.DRAG_STOPPED
    ) {
      tempBrowserTabs = [];
    }
  };

const handleDragDecayedTabConsider = (event: CustomEvent<DndEvent<DraggableBookmarkSchema>>) => {
  const { trigger, id } = event.detail.info;

  // find index of dragged tab in the browser tabs store
  const draggedDecayedTabInStoreIdx = $decayedTabs.findIndex(b => b.id === id);

  if (draggedDecayedTabInStoreIdx >= 0 && trigger === TRIGGERS.DRAG_STARTED) {
    event.detail.items = event.detail.items.filter(b => !b[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
    event.detail.items.splice(draggedDecayedTabInStoreIdx, 0, {
      // duplicate tab with fake id temporarily
      ...$decayedTabs[draggedDecayedTabInStoreIdx],
      id: `${id}-${randomSuffix()}`,
    });
    tempDecayedTabs = event.detail.items;
  } else if (
    trigger === TRIGGERS.DROPPED_INTO_ANOTHER ||
    trigger === TRIGGERS.DROPPED_OUTSIDE_OF_ANY ||
    trigger === TRIGGERS.DRAG_STOPPED
  ) {
    tempDecayedTabs = [];
  }
};
// TODO: for some reason this is not being called
const styleDraggedTab = (element: HTMLElement | undefined) => {
  if (!element) return;
  modifyElementClasses(element, ["shadow-xl"]);
};

run(() => {
  updatedLifetimes = $tabLifetimes;
});
</script>

<div class="h-full overflow-x-hidden overflow-y-auto pr-3">
  {#each drawingWindowTabs as tabs, windowIndex}
    <h3 class="pl-5 text-sm font-extralight">
      {#if windowIndex === 0}Current
      {/if}Window Tabs
      <span class="text-gray-300 dark:text-gray-600">({tabs.length})</span>
    </h3>
    <div
      use:dndzone={{
        items: tabs,
        dropTargetStyle: {},
        dropFromOthersDisabled: true,
        transformDraggedElement: styleDraggedTab,
        type: "bookmark",
      }}
      onconsider={handleDragTabConsider(windowIndex)}
      onfinalize={handleDragTab}>
      {#each tabs as tab (tab.id)}
        {@const lifetime = getTabLifetime(tab, updatedLifetimes)}
        <Bookmark
          key={tab.id}
          description={tab.description}
          href={tab.href}
          favIconUrl={tab.favIconUrl}
          {...lifetime ? { decay: calculateDecay(tab, lifetime) } : {}}
          openBookmark={() => {
            switchToWindow(tab.windowId);
            switchToTab(tab._id);
          }}
          closeBookmark={() => closeTab(tab._id)} />
      {/each}
    </div>
  {/each}
  <h3 class="mt-3 pl-5 text-sm font-extralight">
    Decayed Tabs <span class="text-gray-300 dark:text-gray-600">({$decayedTabs.length})</span>
  </h3>
  <div
    use:dndzone={{
      items: drawingDecayedTabs,
      dropTargetStyle: {},
      dropFromOthersDisabled: true,
      transformDraggedElement: styleDraggedTab,
      type: "bookmark",
    }}
    onconsider={handleDragDecayedTabConsider}
    onfinalize={handleDragDecayedTab}>
    {#each drawingDecayedTabs as decayedTab}
      <Bookmark
        description={decayedTab.description}
        href={decayedTab.href}
        favIconUrl={decayedTab.favIconUrl}
        closeEnabled={false}
        key={decayedTab.id}
        openBookmark={() => newTab(decayedTab.href)} />
    {/each}
  </div>
</div>
