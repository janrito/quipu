<script>
import { onMount } from "svelte";
import { dndzone, TRIGGERS, SHADOW_ITEM_MARKER_PROPERTY_NAME } from "svelte-dnd-action";

import { UPDATE_DECAY_DISPLAY_INTERVAL } from "../lib/constants";
import {
  closeTab,
  modifyElementClasses,
  newTab,
  randomSuffix,
  calculateDelay,
  switchToTab,
  switchToWindow,
  tabIdToLifetimeId,
} from "../lib/utils";
import browserTabs from "../stores/browser-tabs";
import decayedTabs from "../stores/decayed-tabs";
import tabLifetimes from "../stores/tab-lifetimes";
import Bookmark from "./Bookmark.svelte";

// keep track of temporary tabs, when one is being dragged
let tempBrowserTabs = null;
let tempDecayedTabs = null;

// keep track of active tab lifetimes
let updatedLifetimes = $tabLifetimes;

onMount(() => {
  setTimeout(() => {
    tabLifetimes.sync();
    setInterval(() => {
      tabLifetimes.sync();
    }, UPDATE_DECAY_DISPLAY_INTERVAL);
  }, 100);
});

const switchToTabDispatcher = (windowId, tabId) => () => {
  switchToWindow(windowId);
  switchToTab(tabId);
};

const removeTabDispatcher = tabId => () => {
  closeTab(tabId);
};

const openDecayedTabDispatcher = url => newTab(url);

const handleDragTab = () => {
  tempBrowserTabs = null;
};

const handleDragDecayedTab = () => {
  tempDecayedTabs = null;
};

const getTabLifetime = (tab, updatedLifetimes) => {
  const tabLifetimeMeta = updatedLifetimes[tabIdToLifetimeId(tab._id)] || { lifetime: undefined };
  const { lifetime } = tabLifetimeMeta;
  return lifetime;
};

const calculateDecay = (tab, lifetime) => {
  const delay = calculateDelay(lifetime, tab.lastAccessed);
  return 1 - delay / lifetime;
};

const handleDragTabConsider = windowIndex => event => {
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
      event.detail.items,
      ...$browserTabs.slice(windowIndex + 1),
    ];
  } else if (
    trigger === TRIGGERS.DROPPED_INTO_ANOTHER ||
    trigger === TRIGGERS.DROPPED_OUTSIDE_OF_ANY ||
    trigger === TRIGGERS.DRAG_STOPPED
  ) {
    tempBrowserTabs = null;
  }
};

const handleDragDecayedTabConsider = event => {
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
    tempDecayedTabs = null;
  }
};
// TODO: for some reason this is not being called
const styleDraggedTab = el => modifyElementClasses(el, ["shadow-xl"]);

$: drawingWindowTabs = tempBrowserTabs ? tempBrowserTabs : [...$browserTabs];
$: drawingDecayedTabs = tempDecayedTabs ? tempDecayedTabs : [...$decayedTabs];
$: updatedLifetimes = $tabLifetimes;
</script>

<div class="h-full overflow-y-auto overflow-x-hidden pr-3">
  {#each drawingWindowTabs as tabs, windowIndex}
    <h3 class="pl-5 text-sm font-extralight">
      {#if windowIndex === 0}Current {/if}Window Tabs
      <span class="text-gray-300">({tabs.length})</span>
    </h3>
    <div
      use:dndzone="{{
        items: tabs,
        dropTargetStyle: {},
        dropFromOthersDisabled: true,
        transformDraggedElement: styleDraggedTab,
        type: 'bookmark',
      }}"
      on:consider="{handleDragTabConsider(windowIndex)}"
      on:finalize="{handleDragTab}">
      {#each tabs as tab (tab.id)}
        {@const lifetime = getTabLifetime(tab, updatedLifetimes)}
        <Bookmark
          key="{tab.id}"
          title="{tab.title}"
          url="{tab.url}"
          favIcon="{tab.favIconUrl}"
          decay="{calculateDecay(tab, lifetime)}"
          on:open="{switchToTabDispatcher(tab.windowId, tab._id)}"
          on:close="{removeTabDispatcher(tab._id)}" />
      {/each}
    </div>
  {/each}
  <h3 class="pl-5 mt-3 text-sm font-extralight">
    Decayed Tabs <span class="text-gray-300">({$decayedTabs.length})</span>
  </h3>
  <div
    use:dndzone="{{
      items: drawingDecayedTabs,
      dropTargetStyle: {},
      dropFromOthersDisabled: true,
      transformDraggedElement: styleDraggedTab,
      type: 'bookmark',
    }}"
    on:consider="{handleDragDecayedTabConsider}"
    on:finalize="{handleDragDecayedTab}">
    {#each drawingDecayedTabs as decayedTab}
      <Bookmark
        title="{decayedTab.title}"
        url="{decayedTab.url}"
        favIcon="{decayedTab.favIconUrl}"
        closeEnabled="{false}"
        key="{decayedTab.id}"
        on:open="{openDecayedTabDispatcher(decayedTab.url)}" />
    {/each}
  </div>
</div>
