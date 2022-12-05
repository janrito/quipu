<script>
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
} from "../lib/utils";
import browserTabs from "../stores/browser-tabs";
import decayedTabs from "../stores/decayed-tabs";
import tabLifetimes from "../stores/tab-lifetimes";
import Bookmark from "./Bookmark.svelte";

// keep track of temporary tabs, when one is being dragged
let tempTabs = null;

const switchToTabDispatcher = (windowId, tabId) => () => {
  switchToWindow(windowId);
  switchToTab(tabId);
};

const removeTabDispatcher = tabId => () => {
  closeTab(tabId);
};

const openDecayedTabDispatcher = url => newTab(url);

const handleDragTab = () => {
  tempTabs = null;
};

const calculateDecay = (tab, tabLifetimeMeta) => {
  if (tabLifetimeMeta === undefined) {
    return 0;
  }
  const { lifetime } = tabLifetimeMeta;

  const delay = calculateDelay(lifetime, tab.lastAccessed);

  return 1 - delay / lifetime;
};

const handleDragTabConsider = event => {
  const { trigger, id } = event.detail.info;
  // find index of dragged tab in the browser tabs store
  const draggedTabInStoreIdx = $browserTabs.findIndex(b => b.id === id);

  if (draggedTabInStoreIdx >= 0 && trigger === TRIGGERS.DRAG_STARTED) {
    event.detail.items = event.detail.items.filter(b => !b[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
    event.detail.items.splice(draggedTabInStoreIdx, 0, {
      // duplicate tab with fake id temporarily
      ...$browserTabs[draggedTabInStoreIdx],
      id: `${id}-${randomSuffix()}`,
    });
    tempTabs = event.detail.items;
  } else if (
    trigger === TRIGGERS.DROPPED_INTO_ANOTHER ||
    trigger === TRIGGERS.DROPPED_OUTSIDE_OF_ANY ||
    trigger === TRIGGERS.DRAG_STOPPED
  ) {
    tempTabs = null;
  }
};
// TODO: for some reason this is not being called
const styleDraggedTab = el => modifyElementClasses(el, ["shadow-xl"]);
let updatedLifetimes = $tabLifetimes;
setTimeout(() => {
  updatedLifetimes = $tabLifetimes;
  setInterval(() => {
    updatedLifetimes = $tabLifetimes;
  }, UPDATE_DECAY_DISPLAY_INTERVAL);
}, 100);
$: tabs = tempTabs ? tempTabs : [...$browserTabs];
$: anmiatedLifetimes = updatedLifetimes;
</script>

<div class="h-full overflow-y-auto overflow-x-hidden pr-3">
  <h3 class="pl-5 text-sm font-extralight">
    Open Tabs <span class="text-gray-300">({$browserTabs.length})</span>
  </h3>
  <div
    use:dndzone="{{
      items: tabs,
      dropTargetStyle: {},
      dropFromOthersDisabled: true,
      transformDraggedElement: styleDraggedTab,
      type: 'bookmark',
    }}"
    on:consider="{handleDragTabConsider}"
    on:finalize="{handleDragTab}">
    {#each tabs as tab (tab.id)}
      <Bookmark
        title="{tab.title}"
        url="{tab.url}"
        favIcon="{tab.favIconUrl}"
        decay="{calculateDecay(tab, anmiatedLifetimes[tab._id])}"
        on:open="{switchToTabDispatcher(tab.windowId, tab._id)}"
        on:close="{removeTabDispatcher(tab._id)}" />
    {/each}
  </div>
  <hr />
  <h3 class="pl-5 mt-3 text-sm font-extralight">
    Decayed Tabs <span class="text-gray-300">({$decayedTabs.length})</span>
  </h3>
  <div>
    {#each $decayedTabs as decayedTab}
      <Bookmark
        title="{decayedTab.title}"
        url="{decayedTab.url}"
        favIcon="{decayedTab.favIconUrl}"
        closeEnabled="{false}"
        on:open="{openDecayedTabDispatcher(decayedTab.url)}" />
    {/each}
  </div>
</div>
