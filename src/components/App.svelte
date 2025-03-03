<script lang="ts">
import appSettings from "~/lib/stores/app-settings.js";

import AppSettingsEditor from "./AppSettingsEditor.svelte";
import Bookmarks from "./Bookmarks.svelte";
import Tabs from "./Tabs.svelte";

let appSettingsActive = $state(false);

const toggleAppSettings = () => {
  appSettingsActive = !appSettingsActive;
};
</script>

<div
  class="flex h-screen w-screen flex-col justify-between font-mono text-base leading-relaxed font-normal text-gray-800">
  <header class="h-7 border-b border-head-600 bg-head-800 px-3 py-1">
    <div class="flex h-full flex-row">
      <div class="h-full">
        <h1 class="ml-7 text-xs font-extralight text-head-400">quipu</h1>
      </div>
      <div class="h-full flex-grow">
        <p class="ml-3 text-xs font-extralight text-head-500">
          <a class="" href="https://pinboard.in/" target="_blank" rel="noopener noreferrer"
            >pinboard</a>
        </p>
      </div>
      <div class="h-full w-56 flex-none">
        <p class="ml-5 text-xs font-extralight text-head-500">
          <a href="#settings" onclick={toggleAppSettings}>settings</a>
        </p>
      </div>
    </div>
  </header>
  <main
    class="mb-auto w-full flex-grow overflow-hidden bg-white pl-3 text-gray-800 dark:bg-black dark:text-gray-100">
    <div class="flex h-full w-full flex-row overflow-hidden">
      <div class="h-full flex-grow overflow-hidden py-3">
        {#if $appSettings}
          {#if appSettingsActive}
            <AppSettingsEditor closeEditor={toggleAppSettings} />
          {:else}
            <Bookmarks />
          {/if}
        {/if}
      </div>
      <div class="h-full w-56 flex-none bg-gray-100 p-2 dark:bg-gray-800"><Tabs /></div>
    </div>
  </main>
  <footer class="h-2 border-t border-head-600 bg-head-800 px-3 py-1">
    <div class="flex h-full flex-row"></div>
  </footer>
</div>
