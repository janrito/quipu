<script>
import browser from "webextension-polyfill";
import { dndzone, TRIGGERS, SHADOW_ITEM_MARKER_PROPERTY_NAME } from "svelte-dnd-action";

import Bookmark from "./Bookmark.svelte";
import { modifyElementClasses, randomSuffix, pAlive } from "../lib/utils";
import browserTabs from "../stores/browser-tabs";
import settings from "../stores/settings.js";

// keep track of temporary tabs, when one is being dragged
let tempTabs = null;

const switchToTabDispatcher = tabId => () => {
  browser.tabs.update(tabId, { active: true });
};

const handleDragTab = () => {
  tempTabs = null;
};

const calculateDecay = (tab, halfLife) => {
  const now = new Date();
  const lastAccessed = tab.lastAccessed.valueOf();
  const pTabAlive = pAlive(now - lastAccessed, halfLife);
  return 1 - pTabAlive;
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
$: tabs = tempTabs ? tempTabs : [...$browserTabs];
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
        decay="{calculateDecay(tab, $settings.tabDecayHalfLife)}"
    {/each}
  </div>
</div>
