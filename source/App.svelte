<script>
import Bookmarks from "./components/Bookmarks.svelte";
import Settings from "./components/Settings.svelte";
import Tabs from "./components/Tabs.svelte";
import settings from "./stores/settings";

let settingsActive = false;

const toggleSettings = () => {
  settingsActive = !settingsActive;
};
</script>

<div class="flex flex-col h-screen w-screen justify-between">
  <header class="h-7 bg-gray-800 border-b border-gray-600 py-1 px-3">
    <div class="flex flex-row h-full">
      <div class="h-full">
        <h1 class="ml-7 text-xs font-extralight text-gray-400">quipu</h1>
      </div>
      <div class="h-full flex-grow">
        <p class="ml-3 text-xs font-extralight text-gray-500">
          <a class="" href="https://pinboard.in/" target="_blank">pinboard</a>
        </p>
      </div>
      <div class="flex-none w-56 h-full">
        <p class="ml-5 text-xs font-extralight text-gray-500">
          <a href="#settings" on:click|preventDefault="{toggleSettings}">settings</a>
        </p>
      </div>
    </div>
  </header>
  <main class="mb-auto flex-grow overflow-hidden w-full pl-3">
    <div class="flex flex-row overflow-hidden h-full w-full">
      <div class="flex-grow overflow-hidden py-3 h-full">
        {#if $settings}
          {#if settingsActive}<Settings on:close="{toggleSettings}" />{:else}<Bookmarks />{/if}
        {/if}
      </div>
      <div class="flex-none bg-gray-100 w-56 p-2 h-full"><Tabs /></div>
    </div>
  </main>
  <footer class="h-2 bg-gray-800 border-t border-gray-600 py-1 px-3">
    <div class="flex flex-row h-full"></div>
  </footer>
</div>
