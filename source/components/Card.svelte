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
import { onMount, createEventDispatcher } from "svelte";
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

let tempBookmarks = null;
let cardElement;
let cols = 4;
let altKeyActive = false;

const dispatch = createEventDispatcher();

const cardResizeObserver = new ResizeObserver(entries => {
  for (let entry of entries) {
    const position = entry.target?.getBoundingClientRect();
    if (position) {
      cols = Math.floor(position?.width / 175);
    }
  }
});

onMount(() => {
  cardResizeObserver.observe(cardElement);
});

const currentTab = memoize(async () => await browser.tabs.getCurrent());

const openBookmarkDispatcher = url => async () =>
  browser.tabs.create({ url, active: false, index: (await currentTab()).index + 1 });

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
  const draggedBookmarkInStore = bookmarks.findIndex(b => b.id === id);

  if (draggedBookmark && draggedBookmarkInStore >= 0) {
    // dragged bookmark belongs in this card, let's keep the order
    const draggedBookmarkIdx = event.detail.items.findIndex(
      b => b[SHADOW_ITEM_MARKER_PROPERTY_NAME]
    );
    tempBookmarks = event.detail.items.filter(b => !b[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
    tempBookmarks.splice(draggedBookmarkInStore, 0, event.detail.items[draggedBookmarkIdx]);
    tempBookmarks = tempBookmarks;
  } else if (draggedBookmark && draggedBookmark.url) {
    // bookmark comes from browser tabs
    event.detail.items = [
      {
        // create a new temp fake bookmark to the end of the card
        ...browserTabToBookmark(draggedBookmark),
        id: id,
        tags: [...parentTags, name],
        [SHADOW_ITEM_MARKER_PROPERTY_NAME]: true,
      },
      ...event.detail.items.filter(b => !b[SHADOW_ITEM_MARKER_PROPERTY_NAME]),
    ];
    tempBookmarks = [...event.detail.items];
  } else if (draggedBookmark) {
    // bookmark comes from a different card
    event.detail.items = [
      { ...draggedBookmark },
      ...event.detail.items.filter(b => !b[SHADOW_ITEM_MARKER_PROPERTY_NAME]),
    ];
    tempBookmarks = [...event.detail.items];
  } else {
    tempBookmarks = [...event.detail.items];
  }
};

const handleDragBookmark = event => {
  const { id, trigger } = event.detail.info;
  const droppedBookmark = event.detail.items.find(b => b.id === id);
  const droppedBookmarkInStore = bookmarks.find(b => b.id === id);

  // reset tempBookmarks
  delay(() => {
    tempBookmarks = null;
  }, 1000);

  if (droppedBookmark && !droppedBookmarkInStore && trigger === TRIGGERS.DROPPED_INTO_ZONE) {
    // actual new bookmark, add it
    if (droppedBookmark.url) {
      dispatch("addNewBookmark", {
        bookmark: {
          ...browserTabToBookmark(droppedBookmark),
          tags: [...parentTags, name],
        },
        sourceTab: droppedBookmark,
      });
    } else {
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
    }
  } else if (
    droppedBookmarkInStore &&
    (!droppedBookmark || trigger === TRIGGERS.DROPPED_INTO_ANOTHER)
  ) {
    // here we would delete the bookmark, this should be handled by the update wherever it's dropped
  } else if (droppedBookmark && droppedBookmarkInStore) {
    // bookmark already in card, do nothing
  } else {
    // cannot find bookmark
  }
};

const styleDraggedBookmark = el => modifyElementClasses(el, ["shadow-xl"]);

const handleAltKeyPressed = event => {
  altKeyActive = event.altKey;
};

$: bookmarksToDraw = tempBookmarks ? tempBookmarks : bookmarks;
$: tagStore = createTagStore($settings.pinboardAPIToken);
</script>

<svelte:window on:keydown="{handleAltKeyPressed}" on:keyup="{handleAltKeyPressed}" />

<div class="flex flex-col bg-white" bind:this="{cardElement}">
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
    class="flex-grow w-full grid {cols ? `grid-cols-${cols}` : 'grid-cols-4'} gap-1 min-h-5"
    use:dndzone="{{
      items: bookmarksToDraw,
      dropTargetStyle: {},
      dropTargetClasses: ['active-droppable-card'],
      dropFromOthersDisabled: untagged,
      transformDraggedElement: styleDraggedBookmark,
      type: 'bookmark',
    }}"
    on:consider="{handleDragBookmarkConsider}"
    on:finalize="{handleDragBookmark}">
    {#each bookmarksToDraw as bookmark (bookmark.id)}
      <Bookmark
        title="{bookmark.description}"
        url="{bookmark.href}"
        key="{bookmark.id}"
        tags="{bookmark.tags}"
        favIcon="{bookmark.favIcon}"
        parentTags="{[...parentTags, name]}"
        on:highlight
        on:open="{openBookmarkDispatcher(bookmark.href)}" />
    {/each}
  </div>
</div>
