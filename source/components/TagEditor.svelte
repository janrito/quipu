<script lang="ts">
import { focus } from "../lib/actions.js";
import type { TagMap } from "../lib/types.js";
import IconDelete from "./IconDelete.svelte";

interface Props {
  value: string;
  suggestedTags: TagMap[];
  deleteTag: () => void;
  close: () => void;
}

let { value = $bindable(), suggestedTags, close, deleteTag }: Props = $props();

let prefix = $state(value);
let selectedSuggestedTagIdx = $state(-1);

let drawSuggestedTags = $derived.by(() => {
  if (prefix) {
    return suggestedTags.filter(tag => tag.name.startsWith(prefix)).slice(0, 5);
  }
  return suggestedTags.slice(0, 5);
});

const handleEdit = (event: Event) => {
  if (!event.target || !(event.target instanceof HTMLInputElement)) {
    return;
  }
  value = event.target.value;
  close();
};

const handleDelete = (event: Event) => {
  event.preventDefault();
  deleteTag();
  close();
};

const handleKeyUp = (event: KeyboardEvent) => {
  if (!event.target || !(event.target instanceof HTMLInputElement)) {
    return;
  }
  const newPrefix = event.target.value;
  if (newPrefix !== prefix) {
    selectedSuggestedTagIdx = 0;
    prefix = newPrefix;
  }
};
const handleKeydown = (event: KeyboardEvent) => {
  if (!event.target || !(event.target instanceof HTMLInputElement)) {
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    event.target.value = value;
    close();
  } else if (event.key === "Enter" && selectedSuggestedTagIdx >= 0) {
    value = drawSuggestedTags[selectedSuggestedTagIdx]?.name || event.target.value;
    close();
  } else if (event.key === "ArrowUp" && selectedSuggestedTagIdx >= 0) {
    selectedSuggestedTagIdx -= 1;
  } else if (event.key === "ArrowDown" && selectedSuggestedTagIdx < drawSuggestedTags.length - 1) {
    selectedSuggestedTagIdx += 1;
  }
};

const selectSuggestedTag = (tag: TagMap) => () => {
  value = tag.name;
  close();
};
const selectedSuggestedTagStyle = "bg-gray-200 dark:bg-gray-700";
</script>

<div class="relative flex min-w-fit flex-row text-sm">
  <input
    type="text"
    class="h-full w-36 border-0 border-b-2 border-gray-200 bg-gray-100 px-0.5 pr-6 pl-1 dark:border-gray-700 dark:bg-gray-800"
    {value}
    onblur={handleEdit}
    onkeydown={handleKeydown}
    onkeyup={handleKeyUp}
    use:focus />
  <button
    class="mr-2 -ml-6 text-red-300 hover:text-red-500 dark:text-red-600 dark:hover:text-red-400"
    onclick={handleDelete}><IconDelete /></button>
  {#if drawSuggestedTags.length > 0}
    <div
      class="absolute top-5 left-0 z-20 w-36 border-b-2 border-gray-300 bg-gray-100 shadow dark:border-gray-600 dark:bg-gray-800">
      <ul>
        {#each drawSuggestedTags as tag, tagIdx}
          <li class="p-0">
            <span
              role="button"
              tabindex="0"
              class="block px-1 pt-0.5 pb-0 {selectedSuggestedTagIdx === tagIdx &&
                selectedSuggestedTagStyle}"
              onkeydown={e => e.key === "Enter" && selectSuggestedTag(tag)()}
              onclick={selectSuggestedTag(tag)}>
              {tag.name}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
