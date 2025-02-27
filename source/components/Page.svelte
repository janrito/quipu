<script lang="ts">
import type { DndEvent } from "svelte-dnd-action";
import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from "svelte-dnd-action";

import type {
  BookmarkSchema,
  BookmarkSchemaInCard,
  GenericBookmarkSchema,
  PageSchema,
  TabBookmarkSchema,
} from "../lib/types.js";
import { closeTab, modifyElementClasses } from "../lib/utils.js";
import appSettings from "../stores/app-settings.js";
import createBookmarksStore from "../stores/bookmarks.js";
import BookmarkEditor from "./BookmarkEditor.svelte";
import Card from "./Card.svelte";
import Spinner from "./Spinner.svelte";

interface Props {
  pageIndex: number;
}

interface DraggableCardSchema {
  name: string;
  id: number;
  [SHADOW_ITEM_MARKER_PROPERTY_NAME]?: boolean;
}

let { pageIndex = $bindable() }: Props = $props();
let page: PageSchema = $derived($appSettings.pages[pageIndex]);

let tempCards: DraggableCardSchema[] = $state([]);
let highlightedBookmarkId: string | undefined = $state(undefined);
let parentTags = $derived([$appSettings.pinboardRootTag, page.name].filter(tag => tag));
let bookmarksStore = $derived(createBookmarksStore($appSettings.pinboardAPIToken, parentTags));

let cards = $derived.by(() => {
  if (tempCards.length) {
    return tempCards;
  }
  if ($appSettings.pages[pageIndex].cards) {
    return $appSettings.pages[pageIndex].cards.map(
      (name, id) => ({ id, name }) as DraggableCardSchema
    );
  }
  return [];
});

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

const createNewCardDispatcher = (cardIndex: number) => () => {
  appSettings.newCard(pageIndex, cardIndex);
};

const renameCardDispatcher = (cardIndex: number) => (newName: string) => {
  if (newName) {
    appSettings.renameCard(pageIndex, cardIndex, newName);
  }
};

const deleteCardDispatcher = (cardIndex: number) => () => {
  $appSettings.pages[pageIndex].cards = $appSettings.pages[pageIndex].cards.filter(
    (_, index) => index !== cardIndex
  );
};

const handleReorderCardsConsider = (event: CustomEvent<DndEvent<DraggableCardSchema>>) => {
  tempCards = event.detail.items;
};

const handleReorderCards = (event: CustomEvent<DndEvent<DraggableCardSchema>>) => {
  const order = [...new Set(event.detail.items.map(card => card.id))];

  if (order.length === $appSettings.pages[pageIndex].cards.length) {
    $appSettings.pages[pageIndex].cards = order.map(
      index => $appSettings.pages[pageIndex].cards[index]
    );
  }
  tempCards = [];
};

const updateBookmark = (bookmark: GenericBookmarkSchema) => {
  bookmarksStore.updateBookmark(bookmark);
};

const deleteBookmark = (href: URL) => {
  bookmarksStore.deleteBookmark(href);
};
const addNewBookmark = (bookmark: TabBookmarkSchema) => {
  bookmarksStore
    .addBookmark(bookmark)
    .then(() => {
      // close tab after adding bookmark
      closeTab(bookmark._id);
    })
    // ignore error, it is already logged
    .catch(() => {});
};

const syncBookmarks = () => {
  bookmarksStore.sync();
};

const highlightBookmark = (id: string) => {
  highlightedBookmarkId = id;
};

const styleDraggedCard = (element: HTMLElement | undefined) => {
  if (!element) return;
  modifyElementClasses(element, ["shadow-xl"]);
};

const narrowPanelStyle = "w-3/5";
const widePanelStyle = "w-full";
</script>

{#each errors as error}
  <div class="overflow-hidden pr-3">
    <p class="border-b-2 border-red-200 bg-red-100 py-2 pl-7 text-sm text-red-300">
      <span class=" text-red-500">{error.status}</span>
      {error.message}
    </p>
  </div>
{/each}
<div class="flex h-full w-full flex-row overflow-hidden">
  <div
    class="flex h-full flex-col overflow-x-hidden overflow-y-auto pr-3 {highlightedBookmark
      ? narrowPanelStyle
      : widePanelStyle}">
    {#if loading}
      <Spinner />
    {:else if (bookmarks && bookmarks.length > 0) || (cards && cards.length)}
      {#if cards}
        <div
          class="flex flex-col"
          use:dndzone={{
            items: cards,
            dropTargetStyle: {},
            dropFromOthersDisabled: true,
            transformDraggedElement: styleDraggedCard,
          }}
          onconsider={handleReorderCardsConsider}
          onfinalize={handleReorderCards}>
          {#each cards as card (card.id)}
            <Card
              {...card}
              bookmarks={filterBookmarksByTag(bookmarks, card.name)}
              {parentTags}
              {highlightBookmark}
              {deleteBookmark}
              renameCard={renameCardDispatcher(card.id)}
              createNewCard={createNewCardDispatcher(card.id)}
              deleteCard={deleteCardDispatcher(card.id)}
              {addNewBookmark}
              {syncBookmarks}
              {updateBookmark} />
          {/each}
        </div>
      {/if}
      <Card
        name="..."
        bookmarks={filterBookmarksWithoutTags(
          bookmarks,
          cards.map(card => card.name)
        )}
        {highlightBookmark}
        {deleteBookmark}
        {parentTags}
        untagged={true}
        createNewCard={createNewCardDispatcher(cards.length)}
        {addNewBookmark}
        {syncBookmarks}
        {updateBookmark} />
    {:else}
      <p class="py-20 text-center text-lg text-gray-300 dark:text-gray-600">
        Add a
        <a
          class="text-gray-400 dark:text-gray-500"
          href="#new-card"
          onclick={createNewCardDispatcher(0)}>card</a>
        or some bookmarks here!
      </p>
    {/if}
  </div>
  {#if highlightedBookmark}
    <div class="flex h-full w-2/5 flex-col overflow-x-hidden overflow-y-auto pr-3">
      <BookmarkEditor
        {...highlightedBookmark}
        {parentTags}
        cardsInPage={$appSettings.pages[pageIndex].cards}
        {updateBookmark}
        {deleteBookmark}
        close={() => (highlightedBookmarkId = undefined)} />
    </div>
  {/if}
</div>
