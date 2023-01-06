<style>
:global(#dnd-action-dragged-el) {
  @apply shadow-xl;
}
</style>

<script>
import { createEventDispatcher } from "svelte";

import IconDelete from "./IconDelete.svelte";

export let key;
export let title;
export let url;
export let tags = [];
export let parentTags = [];
export let favIconUrl;
export let decay = 0;
export let closeEnabled = true;

const dispatch = createEventDispatcher();
const parsedUrl = new URL(url);
const openBookmark = () => dispatch("open");
const closeBookmark = () => dispatch("close");
const highlightBookmark = () => key && dispatch("highlight", key);

const decayProgressBackground =
  decay <= 0.7
    ? "bg-blue-500 dark:bg-blue-500"
    : decay <= 0.9
    ? "bg-orange-500 dark:bg-orange-400"
    : "bg-red-500 dark:bg-red-400";
const tooltipBackground =
  decay <= 0.7
    ? "bg-blue-200 dark:bg-blue-700"
    : decay <= 0.9
    ? "bg-orange-200 dark:bg-orange-700"
    : "bg-red-200 dark:bg-red-700";
const tooltipForeground =
  decay <= 0.7
    ? "text-blue-400 dark:text-blue-500"
    : decay <= 0.9
    ? "text-orange-400 dark:text-orange-500"
    : "text-red-400 dark:text-red-500";

$: tagsToDraw = tags
  .map(tag => ({
    name: tag,
    isParent: parentTags.includes(tag),
  }))
  .sort((a, b) => (a.isParent === b.isParent ? a.name.localeCompare(b.name) : a.isParent ? 1 : -1));
</script>

<div
  class="group/bookmark relative m-1.5 flex cursor-pointer flex-col bg-gray-50 p-1 shadow-gray-900 dark:bg-gray-900 "
  on:keydown="{e => e.key === 'Enter' && openBookmark()}"
  on:click|preventDefault="{openBookmark}">
  {#if closeEnabled}
    <div class="z-10 ml-5 -mb-5 hidden h-5 flex-row justify-end pl-1 group-hover/bookmark:flex">
      <div
        on:keydown="{e => e.key === 'Enter' && closeBookmark()}"
        on:click|preventDefault|stopPropagation="{closeBookmark}"
        class="group/close-button block cursor-pointer align-top text-sm text-red-300 hover:text-red-500">
        <IconDelete class="drop-shadow-sm group-hover/close-button:drop-shadow-lg" />
      </div>
    </div>
  {/if}
  <div class="flex grow flex-row">
    <div class="group/tooltip w-5 flex-none overflow-hidden pr-1 pt-1">
      {#if favIconUrl}
        <img class="h-4 w-4" src="{favIconUrl}" alt="{title}" />
      {:else}
        <div class="-mt-1 ml-1 h-4 w-4">
          <span
            on:keydown="{e => e.key === 'Enter' && highlightBookmark()}"
            on:click|preventDefault|stopPropagation="{highlightBookmark}"
            class="block cursor-pointer align-top text-sm text-gray-200 group-hover/bookmark:text-blue-800 dark:text-gray-700 dark:group-hover/bookmark:text-blue-100"
            >¶</span>
        </div>
      {/if}
      {#if decay}
        <!-- tooltip -->
        <div
          class="absolute -bottom-9 z-10 hidden group-hover/tooltip:flex {decay <= 0.7
            ? 'left-1'
            : decay <= 0.9
            ? 'left-10'
            : '-right-2'} mt-6 flex-col items-center">
          <div class="-mb-2 h-3 w-3 rotate-45 {tooltipBackground}"></div>
          <span
            class="whitespace-no-wrap relative p-2 text-xs leading-none shadow-lg {tooltipBackground} {tooltipForeground}"
            >Decay: {Math.round(decay * 100)}%</span>
        </div>
      {/if}
    </div>
    <div class="flex-grow overflow-hidden">
      <p class="mt-0.5 truncate text-xs font-normal">
        {#if title}{title}{:else}{parsedUrl.hostname}{/if}
      </p>
      <p class="mb-0.5 truncate  text-2xs font-extralight text-gray-300  dark:text-gray-600">
        <span class="font-normal">{parsedUrl.hostname}</span
        >{#if parsedUrl.port}:{parsedUrl.port}{/if}{parsedUrl.pathname}{parsedUrl.search}{parsedUrl.hash}
      </p>
      {#if tagsToDraw && tags.length > 0}
        <p class="truncate text-xs font-extralight">
          {#each tagsToDraw as tag}
            <span
              class="inline-block border-b px-1 {tag.isParent
                ? 'border-blue-400 bg-blue-50 text-blue-500 dark:border-blue-500 dark:bg-blue-900 dark:text-blue-500'
                : 'border-yellow-400 bg-yellow-50 text-yellow-500 dark:border-yellow-500 dark:bg-yellow-900 dark:text-yellow-500'}"
              >{tag.name}</span>
            <span> </span>
          {/each}
        </p>
      {/if}
    </div>
  </div>
  <div class="-m-1 mt-2 h-px shrink-0 ">
    <div class="w-full bg-gray-200 dark:bg-gray-700">
      <div class="{decayProgressBackground} h-px" style="width: {decay * 100}%"></div>
    </div>
  </div>
</div>
