<script lang="ts" module>
interface Props {
  pageIndex: number;
}
</script>

<script lang="ts">
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

import appSettings from "~/lib/stores/app-settings.js";
import createBookmarksStore from "~/lib/stores/bookmarks.js";
import type {
  AllowedDropTargetDropEffect,
  BookmarkOrTab,
  BookmarkSchema,
  BookmarkSchemaInCard,
} from "~/lib/types.js";
import {
  closeTab,
  isBookmarkOrTab,
  isBookmarkSchemaInCard,
  isTabBookmarkSchema,
} from "~/lib/utils.js";

import BookmarkEditor from "./BookmarkEditor.svelte";
import Card from "./Card.svelte";
import Spinner from "./Spinner.svelte";

let { pageIndex = $bindable() }: Props = $props();

let highlightedBookmarkId: string | undefined = $state(undefined);
let parentTags = $derived(
  [$appSettings.pinboardRootTag, $appSettings.pages[pageIndex].name].filter(tag => tag)
);
let bookmarksStore = $derived(createBookmarksStore($appSettings.pinboardAPIToken, parentTags));

let bookmarks = $derived($bookmarksStore.data);

let highlightedBookmark = $derived(
  bookmarks.find(bookmark => bookmark.id === highlightedBookmarkId)
);
let loading = $derived($bookmarksStore.loading);
let errors = $derived($bookmarksStore.errors);

$effect(() => {
  // this makes it so that detail resets when we update bookmarks
  // - or when a new page is loaded
  highlightedBookmarkId =
    (highlightedBookmarkId &&
      bookmarks.find(bookmark => bookmark.id === highlightedBookmarkId)?.id) ||
    undefined;
});

const filterBookmarksByTag = (bookmarks: BookmarkSchema[], tag: string): BookmarkSchemaInCard[] => {
  if (!(bookmarks && bookmarks.length > 0 && tag)) {
    return [];
  }

  return bookmarks
    .filter(bookmark => bookmark.tags.includes(tag))
    .map(bookmark => ({
      ...bookmark,
      id: `${tag}|${bookmark.id}`,
      _bookmarkId: bookmark.id,
      _cardTag: tag,
    }));
};

const filterBookmarksWithoutTags = (bookmarks: BookmarkSchema[], tags: string[]) => {
  if (!(bookmarks && bookmarks.length > 0)) {
    return [];
  }

  if (!(tags && tags.length > 0)) {
    return bookmarks;
  }

  return bookmarks.filter(bookmark => !tags.some(tag => bookmark.tags.includes(tag)));
};

const createNewCard = (cardIndex?: number) => {
  appSettings.newCard(pageIndex, cardIndex);
};

const renameCard = (cardIndex: number, newName: string) => {
  if (newName) {
    appSettings.renameCard(pageIndex, cardIndex, newName);
  }
};

const deleteCard = (cardIndex: number) => {
  appSettings.deleteCard(pageIndex, cardIndex);
};

const deleteBookmark = (href: URL) => {
  bookmarksStore.deleteBookmark(href);
};
const syncBookmarks = () => {
  bookmarksStore.sync();
};

const highlightBookmark = (id: string) => {
  highlightedBookmarkId = id;
};

const onCardDrop = (sourceName: string, targetData: { name: string; edge: Edge }) => {
  const indexOfSource = $appSettings.pages[pageIndex].cards.findIndex(c => c === sourceName);
  const indexOfTarget = $appSettings.pages[pageIndex].cards.findIndex(c => c === targetData.name);
  if (indexOfTarget < 0 || indexOfSource < 0) {
    return;
  }
  const closestEdgeOfTarget = extractClosestEdge(targetData);
  const newOrder = reorderWithEdge({
    list: $appSettings.pages[pageIndex].cards,
    startIndex: indexOfSource,
    indexOfTarget,
    closestEdgeOfTarget,
    axis: "vertical",
  });

  appSettings.reorderCards(pageIndex, newOrder);
  pageIndex = pageIndex;
};

const onBookmarkDrop = (
  targetName: string,
  tentativeBookmark: BookmarkOrTab,
  action: AllowedDropTargetDropEffect
) => {
  if (isTabBookmarkSchema(tentativeBookmark)) {
    bookmarksStore
      .addBookmark({
        ...tentativeBookmark,
        tags: [...parentTags, targetName],
      })
      .then(() => {
        // close tab after adding bookmark
        closeTab(tentativeBookmark);
      })
      .catch(() => {}); // ignore error, it is already logged
  } else if (
    isBookmarkSchemaInCard(tentativeBookmark) &&
    tentativeBookmark._cardTag !== targetName
  ) {
    // existing bookmark, update details
    bookmarksStore.updateBookmark({
      ...tentativeBookmark,
      tags: [
        ...new Set([
          // keep tags previously in this bookmark,
          // but remove the card it's been dragged from if not copying
          ...(action === "copy"
            ? tentativeBookmark.tags
            : tentativeBookmark.tags.filter(tag => tag !== tentativeBookmark._cardTag)),
          // make sure the parent tags are present
          ...parentTags,
          // add the current card
          targetName,
        ]),
      ],
    });
  }
};

$effect(() => {
  monitorForElements({
    canMonitor: ({ source }) => source.data.type === "card" || source.data.type === "bookmark",
    onDrop: ({ source, location }) => {
      const target = location.current.dropTargets[0];

      if (!target) {
        return;
      }
      const sourceData = source.data;
      const targetData = target.data;

      if (targetData.type !== "card") {
        return;
      }

      if (sourceData.type === "card") {
        onCardDrop(sourceData.name as string, targetData as { name: string; edge: Edge });
        return;
      } else if (sourceData.type === "bookmark" && isBookmarkOrTab(sourceData.bookmark)) {
        onBookmarkDrop(targetData.name as string, sourceData.bookmark, target.dropEffect);
      }
    },
  });
});
</script>

{#each errors as error (error)}
  <div class="overflow-hidden pr-3">
    <p class="border-b-2 border-red-200 bg-red-100 py-2 pl-7 text-sm text-red-300">
      <span class=" text-red-500">{error.status}</span>
      {error.message}
    </p>
  </div>
{/each}
<div class="flex h-full w-full flex-row overflow-hidden">
  <div
    class="peer-[]/highlighted:w-3/5 flex h-full w-full flex-col overflow-x-hidden overflow-y-auto pr-3">
    {#if loading}
      <Spinner />
    {:else if (bookmarks && bookmarks.length > 0) || ($appSettings.pages[pageIndex].cards && $appSettings.pages[pageIndex].cards.length)}
      {#if $appSettings.pages[pageIndex].cards}
        {#each $appSettings.pages[pageIndex].cards as card, cardIndex (card)}
          <Card
            name={card}
            bookmarks={filterBookmarksByTag(bookmarks, card)}
            {parentTags}
            {highlightBookmark}
            {deleteBookmark}
            renameCard={newName => renameCard(cardIndex, newName)}
            createNewCard={() => createNewCard(cardIndex)}
            deleteCard={() => deleteCard(cardIndex)}
            {syncBookmarks} />
        {/each}
      {/if}
      <Card
        name="..."
        bookmarks={filterBookmarksWithoutTags(bookmarks, $appSettings.pages[pageIndex].cards)}
        {highlightBookmark}
        {deleteBookmark}
        {parentTags}
        untagged={true}
        createNewCard={() => createNewCard($appSettings.pages[pageIndex].cards?.length)}
        {syncBookmarks} />
    {:else}
      <p class="py-20 text-center text-lg text-gray-300 dark:text-gray-600">
        Add a
        <a
          class="text-gray-400 dark:text-gray-500"
          href="#new-card"
          onclick={() => createNewCard(0)}>card</a>
        or some bookmarks here!
      </p>
    {/if}
  </div>
  {#if highlightedBookmark}
    <div class="peer/highlighted flex h-full w-2/5 flex-col overflow-x-hidden overflow-y-auto pr-3">
      <BookmarkEditor
        {...highlightedBookmark}
        {parentTags}
        cardsInPage={$appSettings.pages[pageIndex].cards}
        updateBookmark={bookmark => {
          bookmarksStore.updateBookmark(bookmark);
        }}
        {deleteBookmark}
        close={() => (highlightedBookmarkId = undefined)} />
    </div>
  {/if}
</div>
