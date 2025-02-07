<script>
import appSettings from "../stores/app-settings";
import createTagStore from "../stores/tags";
import Page from "./Page.svelte";
import UITabs from "./UITabs.svelte";

let currentPageId = $state(0);

const goToPage = event => {
  currentPageId = Number(event.detail.id);
};

const createNewTab = () => {
  appSettings.newPage();
};

const renameTab = event => {
  const { id, name } = event.detail;
  if (id !== undefined && name !== undefined) {
    appSettings.renamePage(id, name);
  }
};

const deleteTab = event => {
  const { id } = event.detail;
  if ($appSettings.pages.length > 1) {
    $appSettings.pages = $appSettings.pages.filter((_, i) => i !== id);
  }
};

const reorderTab = event => {
  const order = [...new Set(event.detail)];
  if (order.length === $appSettings.pages.length) {
    $appSettings.pages = order.map(index => $appSettings.pages[index]);
  }
};

let pages = $derived($appSettings.pages.map((page, index) => ({ id: index, name: page.name })));
let tagStore = $derived(createTagStore($appSettings.pinboardAPIToken));
</script>

<UITabs
  tabs={pages}
  selectedTabId={currentPageId}
  editable={true}
  tags={$tagStore}
  on:selectTab={goToPage}
  on:createNewTab={createNewTab}
  on:renameTab={renameTab}
  on:deleteTab={deleteTab}
  on:reorderTabs={reorderTab}>
  {#if pages && pages.length > 0}
    <Page pageIndex={currentPageId} />
  {/if}
</UITabs>
