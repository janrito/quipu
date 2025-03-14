<script lang="ts" module>
interface Props {
  description: string;
  href: URL;
  tags?: string[];
  extended?: string;
  parentTags?: string[];
  cardsInPage?: string[];
  updateBookmark: (bookmark: BookmarkSchema) => void;
  deleteBookmark: (href: URL) => void;
  close: () => void;
}

type tagType = "card" | "leaf" | "parent";
</script>

<script lang="ts">
import type { BookmarkSchema } from "~/lib/types.js";

import IconDelete from "./IconDelete.svelte";

let {
  description = $bindable(),
  href,
  tags = $bindable([]),
  extended = $bindable(""),
  parentTags = [],
  cardsInPage = [],
  updateBookmark,
  deleteBookmark,
  close,
}: Props = $props();

const pickTagType = (tag: string): tagType => {
  if (parentTags.includes(tag)) {
    return "parent";
  } else if (cardsInPage.includes(tag)) {
    return "card";
  }
  return "leaf";
};

let tagsToDraw = $derived(
  tags
    .map(tag => ({ name: tag, type: pickTagType(tag) }))
    .sort((a, b) =>
      a.type === b.type
        ? a.name.localeCompare(b.name)
        : typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
    )
);

const onDone = (event: Event) => {
  event.preventDefault();
  close();
};

const onSave = (event: Event) => {
  event.preventDefault();
  // actually save values
  updateBookmark({
    href,
    description,
    extended,
    tags,
  } as BookmarkSchema);
  close();
};

const onDelete = (event: Event) => {
  event.preventDefault();
  deleteBookmark(href);
  close();
};

const updateTags = (event: Event) => {
  if (!event.target || !(event.target instanceof HTMLElement)) {
    return;
  }
  tags = [...new Set(event.target.textContent?.trim().split(/\s+/) || [])];
};

const typeOrder: tagType[] = ["leaf", "card", "parent"];
</script>

<div class="p-2">
  <div
    class="border-b-2 border-gray-200 bg-gray-50 px-2 py-6 dark:border-gray-700 dark:bg-gray-900">
    <h1 class="mb-2 font-normal" contenteditable="true" bind:textContent={description}>
      {description}
    </h1>

    <p
      class="mb-2 border-b-2 border-pink-300 bg-pink-100 text-sm font-extralight break-all text-pink-400 dark:border-pink-600 dark:bg-pink-800 dark:text-pink-500">
      {href}
    </p>

    <p
      class="mb-2 h-32 border-b-2 border-gray-400 bg-gray-100 text-gray-500 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-400"
      contenteditable="true"
      bind:textContent={extended}>
      {extended}
    </p>

    <p
      class="mb-2 border-b-2 border-gray-400 bg-gray-100 text-gray-500 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-400"
      contenteditable="true"
      onblur={updateTags}>
      {tags.join(" ")}
    </p>

    {#if tagsToDraw}
      <p class="mb-2 text-sm font-extralight">
        {#each tagsToDraw as tag (tag.name)}
          <span
            class={[
              "border-b-2 border-yellow-400 bg-yellow-50 px-1 text-yellow-500",
              "dark:border-yellow-500 dark:bg-yellow-900 dark:text-yellow-400",
              "parent-tag:border-blue-400 parent-tag:bg-blue-50 parent-tag:text-blue-500",
              "parent-tag:dark:border-blue-500 parent-tag:dark:bg-blue-900 parent-tag:dark:text-blue-400",
              "card-tag:border-green-400 card-tag:bg-green-50 card-tag:text-green-500",
              "card-tag:dark:border-green-500 card-tag:dark:bg-green-900 card-tag:dark:text-green-400",
              tag.type,
            ]}>
            {tag.name}
          </span>
          <span> </span>
        {/each}
      </p>
    {/if}
  </div>
  <div class="flex flex-row justify-end">
    <button
      class="my-2 mr-auto max-w-1/3 border-b-2 border-red-500 bg-red-200 px-1.5 text-red-500 hover:border-red-200 hover:bg-red-500 hover:text-red-200 dark:border-red-400 dark:bg-red-700 dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-400 dark:hover:text-red-700"
      onclick={onDelete}
      >delete <span class="inline-block align-text-bottom"><IconDelete /></span></button>
    <button
      class="my-2 ml-2 max-w-1/3 border-b-2 border-gray-500 bg-gray-200 px-1.5 text-gray-500 hover:border-gray-200 hover:bg-gray-500 hover:text-gray-200 dark:border-gray-400 dark:bg-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-400 dark:hover:text-gray-700"
      onclick={onDone}>cancel</button>
    <button
      class="my-2 ml-2 max-w-1/3 border-b-2 border-blue-500 bg-blue-200 px-1.5 text-blue-500 hover:border-blue-200 hover:bg-blue-500 hover:text-blue-200 dark:border-blue-400 dark:bg-blue-700 dark:text-blue-400 dark:hover:border-blue-700 dark:hover:bg-blue-400 dark:hover:text-blue-700"
      onclick={onSave}>save</button>
  </div>
</div>
