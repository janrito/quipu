<style>
@reference "../assets/main.pcss";
:global(.active-droppable-tab-target) {
  @apply opacity-80;
}
</style>

<script lang="ts">
import type { Snippet } from "svelte";
import type { DndEvent, Item } from "svelte-dnd-action";
import { dndzone } from "svelte-dnd-action";

import type { TagMap } from "~/lib/types.js";
import { modifyElementClasses } from "~/lib/utils.js";

import UITab from "./UITab.svelte";

interface Props {
  tabs: string[];
  selectedTab: string;
  editable?: boolean;
  suggestedTags?: TagMap[];
  createNewTab?: () => void;
  renameTab?: (oldTabName: string, newTabName: string) => void;
  deleteTab?: (tabName: string) => void;
  reorderTabs?(newOrder: string[]): void;
  children: Snippet;
}

let {
  tabs = $bindable(),
  selectedTab = $bindable(tabs[0]),
  editable = false,
  suggestedTags = [],
  createNewTab = () => {},
  renameTab = () => {},
  deleteTab = () => {},
  reorderTabs = () => {},
  children,
}: Props = $props();

// create in-flight tabs, set initial state to ordered tabs
let inFlightTabs: Item[] = $state([]);
let drawTabs = $derived(
  inFlightTabs.length ? inFlightTabs : tabs.map((tab, index) => ({ id: index, name: tab }))
);

const deleteTabDispatcher = (tabName: string) => () => {
  if (tabs.length > 1) {
    const selectedTabIdx = tabs.findIndex(tab => tab === tabName);
    selectedTab = tabs[selectedTabIdx >= 1 ? selectedTabIdx - 1 : selectedTabIdx];
    deleteTab(tabName);
  }
};

const handleReorderTabsConsider = (event: CustomEvent<DndEvent>) => {
  inFlightTabs = event.detail.items;
};

const handleReorderTabs = (event: CustomEvent<DndEvent>) => {
  const order = event.detail.items.map(tab => tab.name);
  reorderTabs(order);
  selectedTab = order[0];
  inFlightTabs = [];
};

const handleClickCreateNewTab = (event: Event) => {
  event.preventDefault();
  createNewTab();
};

const styleDraggedTab = (element: HTMLElement | undefined) => {
  if (!element) return;
  modifyElementClasses(element, ["shadow-xl", "ring-1", "ring-gray-200"]);
};
</script>

<div class="flex h-full flex-col">
  <nav class="flex h-8 flex-shrink-0 flex-row overflow-y-visible pl-5">
    <div
      class="grid h-7 auto-cols-max grid-flow-col gap-0 overflow-y-visible border-gray-300 dark:border-gray-600"
      use:dndzone={{
        items: drawTabs,
        dropTargetStyle: {},
        dropTargetClasses: ["active-droppable-tab-target"],
        dropFromOthersDisabled: true,
        transformDraggedElement: styleDraggedTab,
        dragDisabled: !editable,
      }}
      onconsider={handleReorderTabsConsider}
      onfinalize={handleReorderTabs}>
      {#each drawTabs as tab}
        <UITab
          label={tab.name}
          {editable}
          {suggestedTags}
          bind:selected={
            () => tab.name === selectedTab, selected => selected && (selectedTab = tab.name)
          }
          deleteTab={deleteTabDispatcher(tab.name)}
          renameTab={newName => renameTab(tab.name, newName)} />
      {/each}
    </div>

    {#if editable}
      <a
        class="mx-1.5 -mb-0.5 px-1.5 text-sm font-normal text-gray-200 dark:text-gray-700"
        href="#new-tab"
        onclick={handleClickCreateNewTab}>+</a>
    {/if}
  </nav>
  <div class="flex-grow overflow-hidden">
    {@render children?.()}
  </div>
</div>
