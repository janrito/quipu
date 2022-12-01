<style>
.selected {
  @apply bg-gray-200;
}
</style>

<script>
import { createEventDispatcher } from "svelte";

import { focus } from "../lib/actions";
import IconDelete from "./IconDelete.svelte";

const dispatch = createEventDispatcher();

export let value;
export let tags;

let prefix = value;
let element;
let selectedSuggestedTagIdx = 0;

const handleEdit = event => {
  dispatch("edit", event.target.value);
  dispatch("exit");
};

const handleDelete = () => {
  dispatch("delete");
  dispatch("exit");
};

const handleKeyUp = event => {
  const newPrefix = event.target.value;
  if (newPrefix !== prefix) {
    selectedSuggestedTagIdx = 0;
    prefix = newPrefix;
  }
};
const handleKeydown = event => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.target.value = value;
    dispatch("exit");
  } else if (event.key === "Enter") {
    dispatch("edit", drawTags[selectedSuggestedTagIdx]?.name || event.target.value);
    dispatch("exit");
  } else if (event.key === "ArrowUp") {
    selectedSuggestedTagIdx = selectedSuggestedTagIdx > 0 ? selectedSuggestedTagIdx - 1 : 0;
  } else if (event.key === "ArrowDown") {
    selectedSuggestedTagIdx =
      selectedSuggestedTagIdx < drawTags.length - 1
        ? selectedSuggestedTagIdx + 1
        : drawTags.length - 1;
  }
};

const selectSuggestedTag = tag => () => {
  dispatch("edit", tag.name);
  dispatch("exit");
};

$: drawTags = prefix
  ? tags.filter(tag => tag.name.startsWith(prefix)).slice(0, 5)
  : tags.slice(0, 5);
$: pos = element ? element.getBoundingClientRect() : null;
$: contextMenuPosition = pos ? `top:${pos.bottom}px;left:${pos.left}px;width:${pos.width}px` : "";
</script>

<div class="text-sm flex flex-row">
  <input
    type="text"
    class="pr-6 -mb-2 h-full max-w-md bg-gray-100 border-b-2 border-gray-300"
    bind:this="{element}"
    value="{value}"
    on:blur="{handleEdit}"
    on:keydown="{handleKeydown}"
    on:keyup="{handleKeyUp}"
    use:focus />
  <button class="-ml-6 text-red-300 hover:text-red-500" on:click|preventDefault="{handleDelete}"
    ><IconDelete /></button>
  {#if drawTags.length > 0}
    <div
      class="absolute shadow bg-gray-50 border-b-2 border-gray-300"
      style="{contextMenuPosition}">
      <ul>
        {#each drawTags as tag, tagIdx}
          <li
            class:selected="{selectedSuggestedTagIdx === tagIdx}"
            class="p-2"
            on:keydown="{e => e.key === 'Enter' && selectSuggestedTag(tag)()}"
            on:click="{selectSuggestedTag(tag)}">
            {tag.name}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
