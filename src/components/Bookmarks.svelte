<script lang="ts">
import appSettings from "~/lib/stores/app-settings.js";
import createTagStore from "~/lib/stores/tags.js";

import Page from "./Page.svelte";
import UITabs from "./UITabs.svelte";

let currentPageName = $state($appSettings.pages[0].name);
let tagStore = createTagStore($appSettings.pinboardAPIToken);

const createNewTab = () => {
  appSettings.newPage();
};

const renameTab = (oldName: string, newName: string) => {
  const index = $appSettings.pages.map(page => page.name).indexOf(oldName);
  if (index === -1) return;
  appSettings.renamePage(index, newName);
};

const deleteTab = (name: string) => {
  if ($appSettings.pages.length > 1) {
    $appSettings.pages = $appSettings.pages.filter(page => name !== page.name);
  }
};

const reorderTab = (newOrder: string[]) => {
  appSettings.reorderPages(newOrder);
};
</script>

<UITabs
  tabs={$appSettings.pages.map(page => page.name)}
  bind:selectedTab={currentPageName}
  editable={true}
  suggestedTags={$tagStore}
  {createNewTab}
  {renameTab}
  {deleteTab}
  reorderTabs={reorderTab}>
  {#if $appSettings.pages && $appSettings.pages.length > 0}
    <Page pageIndex={$appSettings.pages.findIndex(p => p.name === currentPageName)} />
  {/if}
</UITabs>
