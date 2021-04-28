<script>
import Page from "./Page.svelte";
import UITabs from "./UITabs.svelte";

import settings from "../stores/settings.js";
import createTagStore from "../stores/tags";

let currentPageId = 0;

const goToPage = event => {
  currentPageId = Number(event.detail.id);
};

const createNewTab = () => {
  settings.newPage();
};

const renameTab = event => {
  const { id, name } = event.detail;
  if (id !== undefined && name !== undefined) {
    settings.renamePage(id, name);
  }
};

const deleteTab = event => {
  const { id } = event.detail;
  if ($settings.pages.length > 1) {
    $settings.pages = $settings.pages.filter((_, i) => i !== id);
  }
};

const reorderTab = event => {
  const order = [...new Set(event.detail)];
  if (order.length === $settings.pages.length) {
    $settings.pages = order.map(index => $settings.pages[index]);
  }
};

$: pages = $settings.pages.map((page, index) => ({ id: index, name: page.name }));
$: tagStore = createTagStore($settings.pinboardAPIToken);
</script>

<UITabs
  tabs="{pages}"
  selectedTabId="{currentPageId}"
  editable="{true}"
  tags="{$tagStore}"
  on:selectTab="{goToPage}"
  on:createNewTab="{createNewTab}"
  on:renameTab="{renameTab}"
  on:deleteTab="{deleteTab}"
  on:reorderTabs="{reorderTab}">
  {#if pages && pages.length > 0}
    <Page pageIndex="{currentPageId}" />
  {/if}
</UITabs>
