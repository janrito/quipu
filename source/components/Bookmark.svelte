<style>
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

export let key;
export let title;
export let url;
export let tags = [];
export let parentTags = [];
export let favIcon = null;

let hover = false;

const dispatch = createEventDispatcher();
const parsedUrl = new URL(url);
const openBookmark = () => dispatch("open");
const highlightBookmark = () => key && dispatch("highlight", key);

$: tagsToDraw = tags
  .map(tag => ({
    name: tag,
    isParent: parentTags.includes(tag),
  }))
  .sort((a, b) => (a.isParent === b.isParent ? a.name.localeCompare(b.name) : a.isParent ? 1 : -1));
</script>

<div
  class="p-1 m-1.5 flex flex-row bg-gray-50 border-b-2 border-gray-200 cursor-pointer"
  on:click|preventDefault="{openBookmark}"
  on:mouseenter="{() => (hover = true)}"
  on:mouseleave="{() => (hover = false)}">
  <div class="flex-none w-5 pr-1 pt-1 overflow-hidden">
    {#if favIcon}
      <img class="w-4 h-4" src="{favIcon}" alt="{title}" />
    {:else}
      <div class="w-4 h-4 -mt-1 ml-1">
        <span
          on:click|preventDefault|stopPropagation="{highlightBookmark}"
          class="block align-top text-sm {hover ? 'text-blue-800' : 'text-gray-200'} cursor-pointer"
          >¶</span>
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