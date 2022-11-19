<script>
import "@fontsource/iosevka/100.css";
import "@fontsource/iosevka/200.css";
import "@fontsource/iosevka/400.css";

import settings from "./stores/settings";
import Bookmarks from "./components/Bookmarks.svelte";
import Settings from "./components/Settings.svelte";
import Tabs from "./components/Tabs.svelte";

let settingsActive = false;

const toggleSettings = () => {
  settingsActive = !settingsActive;
};
</script>

<div class="flex flex-col h-screen w-screen justify-between">
  <header class="h-7 bg-head-800 border-b border-head-600 py-1 px-3">
    <div class="flex flex-row h-full">
      <div class="h-full">
        <h1 class="ml-7 text-xs font-extralight text-head-400">quipu</h1>
      </div>
      <div class="h-full flex-grow">
        <p class="ml-3 text-xs font-extralight text-head-500">
          <a class="" href="https://pinboard.in/" target="_blank" rel="noreferrer">pinboard</a>
        </p>
      </div>
      <div class="flex-none w-56 h-full">
        <p class="ml-5 text-xs font-extralight text-head-500">
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
  <footer class="h-2 bg-head-800 border-t border-head-600 py-1 px-3">
    <div class="flex flex-row h-full"></div>
  </footer>
</div>
