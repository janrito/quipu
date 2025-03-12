<script lang="ts" module>
interface Props {
  tabs: string[];
  selectedTab: string;
  editable?: boolean;
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

import UITab from "./UITab.svelte";

let {
  tabs = $bindable(),
  selectedTab = $bindable(tabs[0]),
  editable = false,
  createNewTab = () => {},
  renameTab = () => {},
  deleteTab = () => {},
  reorderTabs = () => {},
  children,
}: Props = $props();

const deleteTabAndSelectNext = (tabName: string) => {
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
  <nav class="flex flex-shrink-0 flex-row pl-5">
    <div class="flex flex-row flex-wrap">
      {#each tabs as tab}
        <UITab
          bind:label={() => tab, newName => renameTab(tab, newName)}
          {editable}
          bind:selected={() => tab === selectedTab, selected => selected && (selectedTab = tab)}
          deleteTab={() => deleteTabAndSelectNext(tab)} />
      {/each}
      {#if editable}
        <a
          class="mx-1.5 -mb-0.5 px-1.5 text-sm font-normal text-gray-200 dark:text-gray-700"
          href="#new-tab"
          onclick={handleClickCreateNewTab}>+</a>
      {/if}
    </div>
  </nav>
  <div class="flex-grow overflow-hidden">
    {@render children?.()}
  </div>
</div>
