<script lang="ts" module>
interface Props {
  value: string;
  deleteTag: () => void;
  close: () => void;
}
</script>

<script lang="ts">
import { focus } from "~/lib/actions.js";
import appSettings from "~/lib/stores/app-settings.js";
import createTagStore from "~/lib/stores/tags.js";

import IconDelete from "./IconDelete.svelte";

let { value = $bindable(), close, deleteTag }: Props = $props();

let prefix = $state(value);
let selectedSuggestedTagIdx = $state(-1);
let tagStore = createTagStore($appSettings.pinboardAPIToken);

let drawSuggestedTags = $derived.by(() => {
  if (prefix) {
    return $tagStore.filter(tag => tag.name.startsWith(prefix)).slice(0, 5);
  }
  return $tagStore.slice(0, 5);
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
  } else if (event.key === "Enter") {
    if (selectedSuggestedTagIdx >= 0) {
      value = drawSuggestedTags[selectedSuggestedTagIdx]?.name || event.target.value;
    } else {
      value = event.target.value;
    }
    close();
  } else if (event.key === "ArrowUp" && selectedSuggestedTagIdx >= 0) {
    selectedSuggestedTagIdx -= 1;
  } else if (event.key === "ArrowDown" && selectedSuggestedTagIdx < drawSuggestedTags.length - 1) {
    selectedSuggestedTagIdx += 1;
  }
};

const selectSuggestedTag = (tag: string) => {
  value = tag;
  close();
};
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
      class="absolute top-7 left-0 z-20 w-36 border-b-2 border-gray-300 bg-gray-100 shadow dark:border-gray-600 dark:bg-gray-800">
      <ul>
        {#each drawSuggestedTags as tag, tagIdx}
          <li class="p-0">
            <span
              role="button"
              tabindex="0"
              class:selected={selectedSuggestedTagIdx === tagIdx}
              class="block px-1 pt-0.5 pb-0 [&.selected]:bg-gray-200 [&.selected]:dark:bg-gray-700"
              onkeydown={e => e.key === "Enter" && selectSuggestedTag(tag.name)}
              onclick={() => selectSuggestedTag(tag.name)}
              onmousedown={e => e.preventDefault()}>
              {tag.name}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
