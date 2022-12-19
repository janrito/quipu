<style>
.parentTag {
  @apply border-blue-400 bg-blue-50 text-blue-500;
}
.cardTag {
  @apply border-green-400 bg-green-50 text-green-500;
}
.leafTag {
  @apply border-yellow-400 bg-yellow-50 text-yellow-500;
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
  <div class="border-b-2 border-gray-200 bg-gray-50 px-2 py-6">
    <h1 class="mb-2 font-normal" contenteditable="true" bind:textContent="{description}">
      {description}
    </h1>

    <p
      class="mb-2 break-all border-b-2 border-pink-300 bg-pink-100 text-sm font-extralight text-pink-400">
      {href}
    </p>

    <p
      class="mb-2 h-32 border-b-2 border-gray-400 bg-gray-100 text-gray-500"
      contenteditable="true"
      bind:textContent="{extended}">
      {extended}
    </p>

    <p
      class="mb-2 border-b-2 border-gray-400 bg-gray-100 text-gray-500"
      contenteditable="true"
      on:keyup="{updateTags}">
      {tags.join(" ")}
    </p>

    {#if tagsToDraw}
      <p class="mb-2 text-sm font-extralight">
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
      class="max-w-1/3 my-2 mr-auto border-b-2 border-red-500 bg-red-200 px-1.5  text-red-500 hover:border-red-200 hover:bg-red-500 hover:text-red-200"
      on:click="{onDelete}"
      >delete <span class="inline-block align-text-bottom"><IconDelete /></span></button>
    <button
      class="max-w-1/3 my-2 ml-2  border-b-2 border-gray-500 bg-gray-200 px-1.5  text-gray-500 hover:border-gray-200 hover:bg-gray-500 hover:text-gray-200"
      on:click="{onDone}">cancel</button>
    <button
      class="max-w-1/3 my-2 ml-2 border-b-2 border-blue-500 bg-blue-200 px-1.5  text-blue-500 hover:border-blue-200 hover:bg-blue-500 hover:text-blue-200"
      on:click="{onSave}">save</button>
  </div>
</div>
