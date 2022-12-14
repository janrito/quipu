<style>
.selected {
  @apply border-gray-600 text-gray-800;
}

:global(.active-droppable-tab-target) {
  @apply bg-gray-50;
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

<div class="flex flex-col h-full">
  <nav class="flex-shrink-0 flex flex-row pl-5 overflow-y-visible h-8">
    <div
      class="h-7 grid grid-flow-col auto-cols-max gap-0 border-b-2 border-gray-300 overflow-y-visible"
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
            class:selected="{tab.id === selectedTabId}"
            href="#page-{tab.name}"
            class="mt-0 mx-0 -mb-0.5 px-3 text-sm font-extralight text-gray-400 hover:border-gray-400 border-b-2 bg-white truncate"
            on:click|preventDefault="{clickTabDispatcher(tab.id)}">{tab.name}</a>
        {/if}
      {/each}
    </div>

    {#if editable}
      <a
        class="text-sm font-normal text-gray-200 mx-1.5 -mb-0.5 px-1.5"
        href="#new-tab"
        on:click|preventDefault="{createNewTab}">+</a>
    {/if}
  </nav>
  <div class="flex-grow overflow-hidden">
    <slot />
  </div>
</div>
