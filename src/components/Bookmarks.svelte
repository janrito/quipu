<script lang="ts">
import appSettings from "~/lib/stores/app-settings.js";

import Page from "./Page.svelte";
import UITabs from "./UITabs.svelte";

let currentPageName = $state($appSettings.pages[0].name);

const createNewTab = () => {
  appSettings.newPage();
};

const renameTab = (oldName: string, newName: string) => {
  const index = $appSettings.pages.map(page => page.name).indexOf(oldName);
  if (index === -1) return;
  appSettings.renamePage(index, newName);
  currentPageName = $appSettings.pages[index].name;
};

const deleteTab = (name: string) => {
  if ($appSettings.pages.length <= 1) return;
  const index = $appSettings.pages.map(page => page.name).indexOf(name);
  if (index === -1) return;
  appSettings.deletePage(index);
};

const reorderTab = (newOrder: string[]) => {
  appSettings.reorderPages(newOrder);
};
</script>

<UITabs
  tabs={$appSettings.pages.map(page => page.name)}
  bind:selectedTab={currentPageName}
  editable={true}
  {createNewTab}
  {renameTab}
  {deleteTab}
  reorderTabs={reorderTab}>
  {#if $appSettings.pages && $appSettings.pages.length > 0}
    {@const pageIndex = $appSettings.pages.findIndex(p => p.name === currentPageName)}
    {#if pageIndex >= 0}
      <Page {pageIndex} />
    {/if}
  {/if}
</UITabs>
