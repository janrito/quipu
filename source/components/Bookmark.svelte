<style>
:global(#dnd-action-dragged-el) {
  @apply shadow-xl;
}
.parentTag {
  @apply bg-blue-50 text-blue-500 border-blue-400;
}
.leafTag {
  @apply bg-yellow-50 text-yellow-500 border-yellow-400;
}
.tag {
  @apply border-b-2;
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

const darkBackground = decay <= 0.7 ? "bg-blue-500" : decay <= 0.9 ? "bg-orange-500" : "bg-red-500";
const lightBackground =
  decay <= 0.7 ? "bg-blue-200" : decay <= 0.9 ? "bg-orange-200" : "bg-red-200";
const darkForeground =
  decay <= 0.7 ? "text-blue-400" : decay <= 0.9 ? "text-orange-400" : "text-red-400";

$: tagsToDraw = tags
  .map(tag => ({
    name: tag,
    isParent: parentTags.includes(tag),
  }))
  .sort((a, b) => (a.isParent === b.isParent ? a.name.localeCompare(b.name) : a.isParent ? 1 : -1));
</script>

<div
  class="group/bookmark p-1 m-1.5 flex flex-col bg-gray-50 cursor-pointer relative"
  on:keydown="{e => e.key === 'Enter' && openBookmark()}"
  on:click|preventDefault="{openBookmark}">
  {#if closeEnabled}
    <div class="hidden group-hover/bookmark:flex flex-row h-5 pl-1 ml-5 -mb-5 z-10 justify-end">
      <div
        on:keydown="{e => e.key === 'Enter' && closeBookmark()}"
        on:click|preventDefault|stopPropagation|once="{closeBookmark}"
        class="block align-top text-sm text-red-300 hover:text-red-500 cursor-pointer">
        <IconDelete />
      </div>
    </div>
  {/if}
  <div class="flex flex-row grow">
    <div class="flex-none w-5 pr-1 pt-1 overflow-hidden group/tooltip">
      {#if favIconUrl}
        <img class="w-4 h-4" src="{favIconUrl}" alt="{title}" />
      {:else}
        <div class="w-4 h-4 -mt-1 ml-1">
          <span
            on:keydown="{e => e.key === 'Enter' && highlightBookmark()}"
            on:click|preventDefault|stopPropagation="{highlightBookmark}"
            class="block align-top text-sm text-gray-200 group-hover/bookmark:text-blue-800 cursor-pointer"
            >¶</span>
        </div>
      {/if}
      {#if decay}
        <!-- tooltip -->
        <div
          class="hidden group-hover/tooltip:flex absolute z-10 -bottom-12 {decay <= 0.7
            ? 'left-1'
            : decay <= 0.9
            ? 'left-10'
            : '-right-2'} mt-6 flex-col items-center">
          <div class="w-3 h-3 -mb-2 rotate-45 {lightBackground}"></div>
          <span
            class="relative p-2 text-xs leading-none whitespace-no-wrap shadow-lg {lightBackground} {darkForeground}"
            >Decay: {Math.round(decay * 100)}%</span>
        </div>
      {/if}
    </div>
    <div class="flex-grow overflow-hidden">
      <p class="truncate text-xs font-normal mt-0.5 mb-1.5">
        {#if title}{title}{:else}{parsedUrl.hostname}{/if}
      </p>
      <p
        class="truncate text-xs font-extralight bg-pink-100 text-pink-400 border-b-2 border-pink-300 mb-0.5">
        <span class="font-normal">{parsedUrl.hostname}</span
        >{#if parsedUrl.port}:{parsedUrl.port}{/if}{parsedUrl.pathname}{parsedUrl.search}{parsedUrl.hash}
      </p>
      {#if tagsToDraw && tags.length > 0}
        <p class="truncate text-xs font-extralight">
          {#each tagsToDraw as tag}
            <span class="tag" class:parentTag="{tag.isParent}" class:leafTag="{!tag.isParent}"
              >{tag.name}</span>
            <span> </span>
          {/each}
        </p>
      {/if}
    </div>
  </div>
  <div class="shrink-0 h-px -m-1 mt-2 ">
    <div class="w-full bg-gray-200">
      <div class="{darkBackground} h-px" style="width: {decay * 100}%"></div>
    </div>
  </div>
</div>
