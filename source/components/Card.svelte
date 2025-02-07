<style>
:global(.active-droppable-card) {
  @apply opacity-80 shadow-inner;
}
</style>

<script lang="ts">
import delay from "lodash/delay";
import { createEventDispatcher } from "svelte";
import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME, TRIGGERS } from "svelte-dnd-action";
import { preventDefault } from "svelte/legacy";

import { browserTabToBookmark, modifyElementClasses, newTab } from "../lib/utils";
import appSettings from "../stores/app-settings";
import createTagStore from "../stores/tags";
import Bookmark from "./Bookmark.svelte";
import TagEditor from "./TagEditor.svelte";

interface Props {
  name: any;
  bookmarks?: any;
  parentTags?: any;
  untagged?: boolean;
  editMode?: boolean;
}

let {
  name,
  bookmarks = $bindable([]),
  parentTags = [],
  untagged = false,
  editMode = $bindable(false),
}: Props = $props();

let altKeyActive = false;

const dispatch = createEventDispatcher();

const openBookmarkDispatcher = url => newTab(url);

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
let tagStore = $derived(createTagStore($appSettings.pinboardAPIToken));
</script>

<svelte:window onkeydown={handleAltKeyPressed} onkeyup={handleAltKeyPressed} />

<div class="flex flex-col bg-white shadow-gray-900 dark:bg-black dark:shadow-gray-50">
  {#if editMode}
    <div class="ml-7 flex-shrink-0 py-3">
      <TagEditor
        on:edit={renameCard}
        on:delete={deleteCard}
        on:exit={exitEditMode}
        value={name}
        tags={$tagStore} />
    </div>
  {:else}
    <h3
      class="ml-7 py-3 text-sm {untagged
        ? 'text-gray-200 dark:text-gray-700'
        : 'text-gray-400 dark:text-gray-500'}">
      <a href="#edit-card-{name}" onclick={preventDefault(enterEditMode)}>{name}</a>
      <span class="text-xs text-gray-300 dark:text-gray-600"> ({bookmarks.length})</span>
      {#if bookmarks.length > 1}
        <button
          class="text-xs text-gray-300 dark:text-gray-600"
          onclick={preventDefault(openAllBookmarks)}>
          open all</button>
      {/if}
      <button class="text-gray-200 dark:text-gray-700" onclick={preventDefault(createNewCard)}
        >+</button>
    </h3>
  {/if}

  <div
    class="grid min-h-5 w-full flex-grow gap-1"
    style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))"
    use:dndzone={{
      items: bookmarks,
      dropTargetStyle: {},
      dropTargetClasses: ["active-droppable-card"],
      dropFromOthersDisabled: untagged,
      transformDraggedElement: styleDraggedBookmark,
      type: "bookmark",
    }}
    onconsider={handleDragBookmarkConsider}
    onfinalize={handleDragBookmark}>
    {#each bookmarks as bookmark (bookmark.id)}
      <Bookmark
        title={bookmark.description}
        url={bookmark.href}
        key={bookmark.id}
        tags={bookmark.tags}
        favIconUrl={bookmark.favIcon}
        parentTags={[...parentTags, name]}
        cardsIn
        on:highlight={e => dispatch("highlightBookmark", e.detail)}
        on:close={closeBookmarkDispatcher(bookmark.href)}
        on:open={openBookmarkDispatcher(bookmark.href)} />
    {/each}
  </div>
</div>
