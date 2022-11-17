<style>
.untagged {
  @apply text-gray-200;
}

:global(.active-droppable-card) {
  @apply shadow-inner bg-gray-50;
}
</style>

<script>
import browser from "webextension-polyfill";
import delay from "lodash/delay";
import memoize from "lodash/memoize";
import { createEventDispatcher } from "svelte";
import { dndzone, TRIGGERS, SHADOW_ITEM_MARKER_PROPERTY_NAME } from "svelte-dnd-action";

import Bookmark from "./Bookmark.svelte";
import TagEditor from "./TagEditor.svelte";
import { browserTabToBookmark, modifyElementClasses } from "../lib/utils";
import settings from "../stores/settings.js";
import createTagStore from "../stores/tags";

export let name;
export let bookmarks = [];
export let parentTags = [];
export let untagged = false;
export let editMode = false;

let altKeyActive = false;

const dispatch = createEventDispatcher();

const currentTab = memoize(async () => await browser.tabs.getCurrent());

const openBookmarkDispatcher = url => async () =>
  browser.tabs.create({ url, active: false, index: (await currentTab()).index + 1 });

const closeBookmarkDispatcher = url => () => {
  dispatch("deleteBookmark", { href: url });
};

const openAllBookmarks = () => bookmarks.map(bookmark => openBookmarkDispatcher(bookmark.href)());

const enterEditMode = () => {
  if (!untagged) {
    editMode = true;
  }
};
const exitEditMode = () => {
  if (!untagged) {
    delay(() => {
      editMode = false;
    }, 100);
  }
};
const renameCard = event => {
  if (!untagged) {
    dispatch("renameCard", event.detail);
  }
};

const createNewCard = () => {
  dispatch("createNewCard");
};

const deleteCard = () => {
  if (!untagged) {
    dispatch("deleteCard");
  }
};

const handleDragBookmarkConsider = event => {
  const { id } = event.detail.info;

  // find the dragged item
  const draggedBookmark = event.detail.items.find(b => b[SHADOW_ITEM_MARKER_PROPERTY_NAME]);

  if (draggedBookmark && draggedBookmark._cardTag !== name) {
    const newBookmark = draggedBookmark.url
      ? browserTabToBookmark(draggedBookmark)
      : draggedBookmark;
    bookmarks = [
      {
        ...newBookmark,
        id: id,
        tags: [...parentTags, name],
        [SHADOW_ITEM_MARKER_PROPERTY_NAME]: true,
      },
      ...event.detail.items.filter(b => !b[SHADOW_ITEM_MARKER_PROPERTY_NAME]),
    ].sort((a, b) => b.time - a.time);
  } else {
    bookmarks = event.detail.items.sort((a, b) => b.time - a.time);
  }
};

const handleDragBookmark = event => {
  const { id, trigger } = event.detail.info;
  const droppedBookmark = event.detail.items.find(b => b.id === id);

  if (droppedBookmark && trigger === TRIGGERS.DROPPED_INTO_ZONE) {
    // actual new bookmark, add it
    if (droppedBookmark.url) {
      dispatch("addNewBookmark", {
        bookmark: {
          ...browserTabToBookmark(droppedBookmark),
          tags: [...parentTags, name],
        },
        sourceTab: droppedBookmark,
      });
    } else if (droppedBookmark._cardTag !== name) {
      // existing bookmark, update details
      dispatch("updateBookmarkDetails", {
        ...droppedBookmark,
        tags: [
          ...new Set([
            // keep tags previously in this bookmark, but remove the card it's been dragged from
            ...droppedBookmark.tags.filter(tag => tag !== droppedBookmark._cardTag),
            // make sure the parent tags are present
            ...parentTags,
            // add the current card
            name,
            // if copying, add the original card tag
            ...(altKeyActive ? [droppedBookmark._cardTag] : []),
          ]),
        ],
      });
    } else {
      // dragged from this card, dropped in the same card, sync from store
      dispatch("syncBookmarks");
    }
  }
};

const styleDraggedBookmark = el => modifyElementClasses(el, ["shadow-xl"]);

const handleAltKeyPressed = event => {
  altKeyActive = event.altKey;
};
$: tagStore = createTagStore($settings.pinboardAPIToken);
</script>

<svelte:window on:keydown="{handleAltKeyPressed}" on:keyup="{handleAltKeyPressed}" />

<div class="flex flex-col bg-white">
  {#if editMode}
    <div class="ml-7 py-3 flex-shrink-0">
      <TagEditor
        on:edit="{renameCard}"
        on:delete="{deleteCard}"
        on:exit="{exitEditMode}"
        value="{name}"
        tags="{$tagStore}" />
    </div>
  {:else}
    <h3 class:untagged class="ml-7 py-3 text-sm text-gray-400">
      <a href="#edit-card-{name}" on:click|preventDefault="{enterEditMode}">{name}</a>
      <span class="text-gray-300 text-xs"> ({bookmarks.length})</span>
      {#if bookmarks.length > 1}
        <button class="text-gray-300 text-xs" on:click|preventDefault="{openAllBookmarks}">
          open all</button>
      {/if}
      <button class="text-gray-200" on:click|preventDefault="{createNewCard}">+</button>
    </h3>
  {/if}

  <div
    class="flex-grow w-full gap-1 min-h-5 grid"
    style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))"
    use:dndzone="{{
      items: bookmarks,
      dropTargetStyle: {},
      dropTargetClasses: ['active-droppable-card'],
      dropFromOthersDisabled: untagged,
      transformDraggedElement: styleDraggedBookmark,
      type: 'bookmark',
    }}"
    on:consider="{handleDragBookmarkConsider}"
    on:finalize="{handleDragBookmark}">
    {#each bookmarks as bookmark (bookmark.id)}
      <Bookmark
        title="{bookmark.description}"
        url="{bookmark.href}"
        key="{bookmark.id}"
        tags="{bookmark.tags}"
        favIcon="{bookmark.favIcon}"
        parentTags="{[...parentTags, name]}"
        on:highlight="{e => dispatch('highlightBookmark', e.detail)}"
        on:close="{closeBookmarkDispatcher(bookmark.href)}"
        on:open="{openBookmarkDispatcher(bookmark.href)}" />
    {/each}
  </div>
</div>
