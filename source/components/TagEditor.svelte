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
</script>

<div class="relative flex min-w-fit flex-row text-sm">
  <input
    type="text"
    class="h-full w-36 border-b-2 border-gray-200 bg-gray-100 px-2 pr-6 pl-2 dark:border-gray-700 dark:bg-gray-800"
    bind:this="{element}"
    value="{value}"
    on:blur="{handleEdit}"
    on:keydown="{handleKeydown}"
    on:keyup="{handleKeyUp}"
    use:focus />
  <button
    class="-ml-6 mr-2 text-red-300 hover:text-red-500 dark:text-red-600 dark:hover:text-red-400"
    on:click|preventDefault="{handleDelete}"><IconDelete /></button>
  {#if drawTags.length > 0}
    <div
      class="absolute top-7 left-0 z-20 w-36 border-b-2 border-gray-300 bg-gray-100 shadow dark:border-gray-600 dark:bg-gray-800">
      <ul>
        {#each drawTags as tag, tagIdx}
          <li
            class="p-2 {selectedSuggestedTagIdx === tagIdx && drawTags.length > 1
              ? 'bg-gray-200 dark:bg-gray-700'
              : ''}"
            on:keydown="{e => e.key === 'Enter' && selectSuggestedTag(tag)()}"
            on:click="{selectSuggestedTag(tag)}">
            {tag.name}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
