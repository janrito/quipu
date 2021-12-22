<script>
import { beforeUpdate } from "svelte";
import browser from "webextension-polyfill";
import { dndzone } from "svelte-dnd-action";

import Spinner from "./Spinner.svelte";
import BookmarkEditor from "./BookmarkEditor.svelte";
import Card from "./Card.svelte";

import { modifyElementClasses } from "../lib/utils";
import createBookmarksStore from "../stores/bookmarks.js";
import settings from "../stores/settings.js";

export let pageIndex;

// tempCards keeps track of the temporary order of cards whilst dragging
let tempCards = null;

// detail is highlighted
let detail;

beforeUpdate(() => {
  // this makes it so that detail resets when we update bookmarks
  // - or when a new page is loaded
  detail = detail && bookmarks.find(bookmark => bookmark.id === detail.id);
});

const filterBookmarksByTag = (bookmarks, tag) => {
  if (!(bookmarks && bookmarks.length > 0 && tag)) {
    return [];
  }

  return bookmarks
    .filter(bookmark => bookmark.tags.includes(tag))
    .map(bookmark => ({
      ...bookmark,
      id: `${tag}|${bookmark.id}`,
      _cardTag: tag,
    }));
};

const filterBookmarksWithoutTags = (bookmarks, tags) => {
  if (!(bookmarks && bookmarks.length > 0)) {
    return [];
  }

  if (!(tags && tags.length > 0)) {
    return bookmarks;
  }

  return bookmarks
    .filter(bookmark => !tags.some(tag => bookmark.tags.includes(tag)))
    .map(bookmark => ({ ...bookmark, id: `...|${bookmark.id}` }));
};

const createNewCardDispatcher = cardIndex => () => {
  settings.newCard(pageIndex, cardIndex);
};

const renameCardDispatcher = cardIndex => event => {
  const newName = event.detail;
  if (newName) {
    settings.renameCard(pageIndex, cardIndex, newName);
  }
};

const deleteCardDispatcher = cardIndex => () => {
  $settings.pages[pageIndex].cards = $settings.pages[pageIndex].cards.filter(
    (_, index) => index !== cardIndex
  );
};

const handleReorderCardsConsider = event => {
  tempCards = event.detail.items;
};

const handleReorderCards = event => {
  const order = [...new Set(event.detail.items.map(card => card.id))];

  if (order.length === $settings.pages[pageIndex].cards.length) {
    $settings.pages[pageIndex].cards = order.map(index => $settings.pages[pageIndex].cards[index]);
  }
  tempCards = null;
};

const updateBookmarkDetails = event => {
  bookmarksStore.updateBookmark({ ...event.detail });
};

const deleteBookmark = event => {
  bookmarksStore.deleteBookmark({ ...event.detail });
};
const addNewBookmark = event => {
  const { bookmark, sourceTab } = event.detail;
  bookmarksStore
    .addBookmark(bookmark)
    .then(() => {
      // close tab after adding bookmark
      browser.tabs.remove(sourceTab._id);
    })
    // ignore error, it is already logged
    .catch(() => {});
};

const syncBookmarks = () => {
  bookmarksStore.sync();
};

const highLightBookmark = event => {
  const [, _id] = event.detail.split("|", 2);
  detail = bookmarks.find(bookmark => bookmark.id === _id);
};

const styleDraggedCard = el => modifyElementClasses(el, ["shadow-xl"]);

$: parentTags = [$settings.pinboardRootTag, $settings.pages[pageIndex].name].filter(tag => tag);
$: bookmarksStore = createBookmarksStore($settings.pinboardAPIToken, parentTags);
$: cards = tempCards
  ? tempCards
  : $settings.pages[pageIndex].cards
  ? $settings.pages[pageIndex].cards.map((name, id) => ({ id, name }))
  : [];
$: bookmarks = $bookmarksStore.data;
$: loading = $bookmarksStore.loading;
$: errors = $bookmarksStore.errors;
</script>

{#each errors as error}
  <div class="pr-3 overflow-hidden">
    <p class="py-2 pl-7 bg-red-100 text-red-300 border-b-2 border-red-200 text-sm">
      <span class=" text-red-500">{error.status}</span>
      {error.description}
    </p>
  </div>
{/each}
<div class="flex flex-row w-full h-full overflow-hidden">
  <div
    class="h-full flex flex-col overflow-y-auto overflow-x-hidden pr-3 {detail
      ? 'w-3/5'
      : 'w-full'}">
    {#if loading}
      <Spinner />
    {:else if (bookmarks && bookmarks.length > 0) || (cards && cards.length)}
      {#if cards}
        <div
          class="flex flex-col"
          use:dndzone="{{
            items: cards,
            dropTargetStyle: {},
            dropFromOthersDisabled: true,
            transformDraggedElement: styleDraggedCard,
          }}"
          on:consider="{handleReorderCardsConsider}"
          on:finalize="{handleReorderCards}">
          {#each cards as card (card.id)}
            <Card
              {...card}
              bookmarks="{filterBookmarksByTag(bookmarks, card.name)}"
              parentTags="{parentTags}"
              on:highlight="{highLightBookmark}"
              on:renameCard="{renameCardDispatcher(card.id)}"
              on:createNewCard="{createNewCardDispatcher(card.id)}"
              on:deleteCard="{deleteCardDispatcher(card.id)}"
              on:addNewBookmark="{addNewBookmark}"
              on:syncBookmarks="{syncBookmarks}"
              on:updateBookmarkDetails="{updateBookmarkDetails}" />
          {/each}
        </div>
      {/if}
      <Card
        name="..."
        bookmarks="{filterBookmarksWithoutTags(
          bookmarks,
          cards.map(card => card.name)
        )}"
        on:highlight="{highLightBookmark}"
        parentTags="{parentTags}"
        untagged="{true}"
        on:createNewCard="{createNewCardDispatcher(cards.length)}" />
    {:else}
      <p class="py-20 text-center text-gray-300 text-lg">
        Add a
        <a class="text-gray-400" href="#new-card" on:click="{createNewCardDispatcher(0)}">card</a>
        or some bookmarks here!
      </p>
    {/if}
  </div>
  {#if detail}
    <div class="h-full w-2/5 flex flex-col overflow-y-auto overflow-x-hidden pr-3">
      <BookmarkEditor
        {...detail}
        parentTags="{parentTags}"
        cardsInPage="{$settings.pages[pageIndex].cards}"
        on:update="{updateBookmarkDetails}"
        on:delete="{deleteBookmark}"
        on:done="{() => (detail = null)}" />
    </div>
  {/if}
</div>
