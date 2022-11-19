<style>
.parentTag {
  @apply bg-blue-50 text-blue-500 border-blue-400;
}
.cardTag {
  @apply bg-green-50 text-green-500 border-green-400;
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

export let description;
export let href;
export let tags = [];
export let extended = "";
export let parentTags = [];
export let cardsInPage = [];

const dispatch = createEventDispatcher();

const onDone = () => {
  dispatch("done");
};

const onSave = () => {
  // actually save values
  dispatch("update", {
    href,
    description,
    extended,
    tags,
  });
  dispatch("done");
};

const onDelete = () => {
  dispatch("delete", { href });
  dispatch("done");
};

const updateTags = event => {
  tags = [...new Set(event.target.textContent.trim().split(/\s+/))];
};

const typeOrder = ["leafTag", "cardTag", "parentTag"];

$: tagsToDraw = tags
  .map(tag => ({
    name: tag,
    type: parentTags.includes(tag)
      ? "parentTag"
      : cardsInPage.includes(tag)
      ? "cardTag"
      : "leafTag",
  }))
  .sort((a, b) =>
    a.type === b.type
      ? a.name.localeCompare(b.name)
      : typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
  );
</script>

<div class="p-2">
  <div class="px-2 py-6 bg-gray-50 border-b-2 border-gray-200">
    <h1 class="font-normal mb-2" contenteditable="true" bind:textContent="{description}">
      {description}
    </h1>

    <p
      class="font-extralight text-sm mb-2 break-all bg-pink-100 text-pink-400 border-b-2 border-pink-300">
      {href}
    </p>

    <p
      class="bg-gray-100 text-gray-500 border-b-2 border-gray-400 h-32 mb-2"
      contenteditable="true"
      bind:textContent="{extended}">
      {extended}
    </p>

    <p
      class="bg-gray-100 text-gray-500 border-b-2 border-gray-400 mb-2"
      contenteditable="true"
      on:keyup="{updateTags}">
      {tags.join(" ")}
    </p>

    {#if tagsToDraw}
      <p class="font-extralight text-sm mb-2">
        {#each tagsToDraw as tag}
          <span class="tag {tag.type}">
            {tag.name}
          </span>
          <span> </span>
        {/each}
      </p>
    {/if}
  </div>
  <div class="flex flex-row justify-end">
    <button
      class="max-w-1/3 my-2 mr-auto px-1.5 border-b-2 bg-red-200 hover:bg-red-500  border-red-500 hover:border-red-200 text-red-500 hover:text-red-200"
      on:click="{onDelete}"
      >delete <span class="inline-block align-text-bottom"><IconDelete /></span></button>
    <button
      class="max-w-1/3 my-2 ml-2  px-1.5 border-b-2 bg-gray-200 hover:bg-gray-500  border-gray-500 hover:border-gray-200 text-gray-500 hover:text-gray-200"
      on:click="{onDone}">cancel</button>
    <button
      class="max-w-1/3 my-2 ml-2 px-1.5 border-b-2 bg-blue-200 hover:bg-blue-500  border-blue-500 hover:border-blue-200 text-blue-500 hover:text-blue-200"
      on:click="{onSave}">save</button>
  </div>
</div>
