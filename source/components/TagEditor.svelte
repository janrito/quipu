<script lang="ts">
import { createEventDispatcher } from "svelte";
import { preventDefault } from "svelte/legacy";

import { focus } from "../lib/actions";
import IconDelete from "./IconDelete.svelte";

interface Tag {
  name: string;
}

const dispatch = createEventDispatcher();

let { value, tags }: { value: string; tags: Tag[] } = $props();

let prefix = $state(value);
let element = $state();
let selectedSuggestedTagIdx = $state(0);

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

const selectSuggestedTag = (tag: Tag) => () => {
  dispatch("edit", tag.name);
  dispatch("exit");
};

let drawTags = $derived(
  prefix ? tags.filter(tag => tag.name.startsWith(prefix)).slice(0, 5) : tags.slice(0, 5)
);
</script>

<div class="relative flex min-w-fit flex-row text-sm">
  <input
    type="text"
    class="h-full w-36 border-b-2 border-gray-200 bg-gray-100 px-2 pl-2 pr-6 dark:border-gray-700 dark:bg-gray-800"
    bind:this={element}
    {value}
    onblur={handleEdit}
    onkeydown={handleKeydown}
    onkeyup={handleKeyUp}
    use:focus />
  <button
    class="-ml-6 mr-2 text-red-300 hover:text-red-500 dark:text-red-600 dark:hover:text-red-400"
    onclick={preventDefault(handleDelete)}><IconDelete /></button>
  {#if drawTags.length > 0}
    <div
      class="absolute left-0 top-7 z-20 w-36 border-b-2 border-gray-300 bg-gray-100 shadow dark:border-gray-600 dark:bg-gray-800">
      <ul>
        {#each drawTags as tag, tagIdx}
          <li
            role="button"
            tabindex="0"
            class="p-2 {selectedSuggestedTagIdx === tagIdx && drawTags.length > 1
              ? 'bg-gray-200 dark:bg-gray-700'
              : ''}"
            onkeydown={e => e.key === "Enter" && selectSuggestedTag(tag)()}
            onclick={selectSuggestedTag(tag)}>
            {tag.name}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
