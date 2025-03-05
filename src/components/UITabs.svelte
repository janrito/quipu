<script lang="ts" module>
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
</script>

<script lang="ts">
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Snippet } from "svelte";

import type { TagMap } from "~/lib/types.js";

import UITab from "./UITab.svelte";

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

const deleteTabDispatcher = (tabName: string) => () => {
  if (tabs.length > 1) {
    const selectedTabIdx = tabs.findIndex(tab => tab === tabName);
    selectedTab = tabs[selectedTabIdx >= 1 ? selectedTabIdx - 1 : selectedTabIdx];
    deleteTab(tabName);
  }
};

const handleClickCreateNewTab = (event: Event) => {
  event.preventDefault();
  createNewTab();
};
$effect(() => {
  if (editable) {
    monitorForElements({
      canMonitor: ({ source }) => source.data.type === "UITab",
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0];
        if (!target) {
          return;
        }
        const sourceData = source.data;
        const targetData = target.data;

        if (sourceData.type !== "UITab" || targetData.type !== "UITab") {
          return;
        }
        const indexOfSource = tabs.findIndex(t => t === sourceData.label);
        const indexOfTarget = tabs.findIndex(t => t === targetData.label);

        if (indexOfTarget < 0 || indexOfSource < 0) {
          return;
        }
        const closestEdgeOfTarget = extractClosestEdge(targetData);

        const newOrder = reorderWithEdge({
          list: tabs,
          startIndex: indexOfSource,
          indexOfTarget,
          closestEdgeOfTarget,
          axis: "horizontal",
        });

        reorderTabs(newOrder);
      },
    });
  }
});
</script>

<div class="flex h-full flex-col">
  <nav class="flexflex-shrink-0 flex-row pl-5">
    <div class="grid auto-cols-max grid-flow-col gap-x-0 overflow-x-scroll">
      {#each tabs as tab}
        <UITab
          label={tab}
          {editable}
          {suggestedTags}
          bind:selected={() => tab === selectedTab, selected => selected && (selectedTab = tab)}
          deleteTab={deleteTabDispatcher(tab)}
          renameTab={newName => renameTab(tab, newName)} />
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
