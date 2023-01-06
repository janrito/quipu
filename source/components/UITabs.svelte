<style>
:global(.active-droppable-tab-target) {
  @apply opacity-80;
}
</style>

<script>
import { onMount, createEventDispatcher } from "svelte";
import { dndzone } from "svelte-dnd-action";
import delay from "lodash/delay";

import { modifyElementClasses } from "../lib/utils";
import TagEditor from "./TagEditor.svelte";

export let tabs;
export let selectedTabId;
export let editable = false;
export let editMode = null;
export let tags;

const dispatch = createEventDispatcher();

onMount(() => {
  // select the first tab if none is selected
  selectedTabId = selectedTabId || tabs[0].id;
});

const enterEditMode = id => {
  editMode = id;
};
const exitEditMode = () => {
  delay(() => {
    editMode = null;
  }, 100);
};

const clickTabDispatcher = id => () => {
  if (id === selectedTabId) {
    enterEditMode(id);
  } else {
    dispatch("selectTab", { id });
  }
};

const createNewTab = () => {
  dispatch("createNewTab");
};

const renameTabDispatcher = id => event => {
  dispatch("renameTab", { id, name: event.detail });
};

const deleteTabDispatcher = id => () => {
  if (tabs.length > 1) {
    const currentTabIdx = tabs.findIndex(tab => tab.id === id);
    dispatch("selectTab", {
      id: tabs[currentTabIdx >= 1 ? currentTabIdx - 1 : currentTabIdx].id,
    });
    dispatch("deleteTab", { id });
  }
};

const handleReorderTabsConsider = event => {
  tabs = event.detail.items;
};

const handleReorderTabs = event => {
  const order = event.detail.items.map(tab => tab.id);
  dispatch("reorderTabs", order);
  dispatch("selectTab", { id: order.indexOf(selectedTabId) });
};

const styleDraggedTab = el => modifyElementClasses(el, ["shadow-xl", "ring-1", "ring-gray-200"]);

$: drawTabs = tabs;
</script>

<div class="flex h-full flex-col">
  <nav class="flex h-8 flex-shrink-0 flex-row overflow-y-visible pl-5">
    <div
      class="grid h-7 auto-cols-max grid-flow-col gap-0 overflow-y-visible border-gray-300 dark:border-gray-600"
      use:dndzone="{{
        items: drawTabs,
        dropTargetStyle: {},
        dropTargetClasses: ['active-droppable-tab-target'],
        dropFromOthersDisabled: true,
        transformDraggedElement: styleDraggedTab,
        dragDisabled: !editable,
      }}"
      on:consider="{handleReorderTabsConsider}"
      on:finalize="{handleReorderTabs}">
      {#each drawTabs as tab (tab.id)}
        {#if editable && editMode === tab.id}
          <TagEditor
            on:edit="{renameTabDispatcher(tab.id)}"
            on:delete="{deleteTabDispatcher(tab.id)}"
            on:exit="{exitEditMode}"
            value="{tab.name}"
            tags="{tags}" />
        {:else}
          <a
            href="#page-{tab.name}"
            class="mx-0 mt-0 -mb-0.5 truncate border-b-2 bg-white px-3 text-sm font-extralight hover:border-gray-400 dark:bg-black hover:dark:border-gray-500 {tab.id ===
            selectedTabId
              ? 'border-gray-600 text-gray-800 dark:border-gray-300 dark:text-gray-200'
              : 'border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500'}"
            on:click|preventDefault="{clickTabDispatcher(tab.id)}">{tab.name}</a>
        {/if}
      {/each}
    </div>

    {#if editable}
      <a
        class="mx-1.5 -mb-0.5 px-1.5 text-sm font-normal text-gray-200 dark:text-gray-700"
        href="#new-tab"
        on:click|preventDefault="{createNewTab}">+</a>
    {/if}
  </nav>
  <div class="flex-grow overflow-hidden">
    <slot />
  </div>
</div>
