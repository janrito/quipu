<style>
@reference "../assets/main.pcss";
:global(.active-droppable-card) {
  @apply opacity-80 shadow-inner;
}
</style>

<script lang="ts" module>
interface Props {
  name: string;
  bookmarks?: DraggableBookmarkSchema[];
  parentTags?: string[];
  untagged?: boolean;
  editMode?: boolean;
  deleteBookmark: (href: URL) => void;
  addNewBookmark: (bookmark: TabBookmarkSchema) => void;
  updateBookmark: (bookmark: GenericBookmarkSchema) => void;
  highlightBookmark: (bookmarkId: string) => void;
  syncBookmarks: () => void;
  renameCard?: (newName: string) => void;
  deleteCard?: () => void;
  createNewCard: () => void;
}
</script>

<script lang="ts">
import { delay } from "lodash";
import type { DndEvent } from "svelte-dnd-action";
import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME, TRIGGERS } from "svelte-dnd-action";

import appSettings from "~/lib/stores/app-settings.js";
import createTagStore from "~/lib/stores/tags.js";
import type {
  DraggableBookmarkSchema,
  GenericBookmarkSchema,
  TabBookmarkSchema,
} from "~/lib/types.js";

import { isBookmarkSchemaInCard, isTab, modifyElementClasses, newTab } from "../lib/utils.js";
import Bookmark from "./Bookmark.svelte";
import TagEditor from "./TagEditor.svelte";

let {
  name,
  bookmarks = $bindable([]),
  parentTags = [],
  untagged = false,
  editMode = $bindable(false),
  deleteBookmark,
  addNewBookmark,
  updateBookmark,
  highlightBookmark,
  syncBookmarks,
  renameCard = () => {},
  deleteCard = () => {},
  createNewCard,
}: Props = $props();

let tagStore = $derived(createTagStore($appSettings.pinboardAPIToken));

let altKeyActive = false;

const closeBookmarkDispatcher = (url: URL) => () => {
  deleteBookmark(url);
};

const openAllBookmarks = (event: Event) => {
  event.preventDefault();
  bookmarks.map(bookmark => newTab(bookmark.href));
};

const enterEditMode = (event: Event) => {
  event.preventDefault();
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

const handleCreateNewCard = (event: Event) => {
  event.preventDefault();
  createNewCard();
};

const sortBookmarksToDraw = (
  bookmarksToDraw: DraggableBookmarkSchema[]
): DraggableBookmarkSchema[] => {
  return bookmarksToDraw.sort((a, b) => {
    if ("time" in a && "time" in b) {
      return b.time - a.time;
    } else if ("time" in a) {
      return -1;
    } else if ("time" in b) {
      return 1;
    } else {
      return 0;
    }
  });
};

const handleDragBookmarkConsider = (event: CustomEvent<DndEvent<DraggableBookmarkSchema>>) => {
  // find the dragged item
  const draggedBookmark = event.detail.items.find(b => b[SHADOW_ITEM_MARKER_PROPERTY_NAME]);

  if (
    !draggedBookmark ||
    (!isTab(draggedBookmark) &&
      isBookmarkSchemaInCard(draggedBookmark) &&
      draggedBookmark._cardTag === name)
  ) {
    // dragged from this card, don't allow dropping in the same card
    bookmarks = event.detail.items;
  } else {
    bookmarks = [
      {
        ...draggedBookmark,
        tags: [...parentTags, name],
        [SHADOW_ITEM_MARKER_PROPERTY_NAME]: true,
      },
      ...event.detail.items.filter(b => !b[SHADOW_ITEM_MARKER_PROPERTY_NAME]),
    ];
  }
  bookmarks = sortBookmarksToDraw(bookmarks);
};

const handleDragBookmark = (event: CustomEvent<DndEvent<DraggableBookmarkSchema>>) => {
  const { id, trigger } = event.detail.info;
  const droppedBookmark = event.detail.items.find(b => b.id === id);

  if (droppedBookmark && trigger === TRIGGERS.DROPPED_INTO_ZONE) {
    // actual new bookmark, add it
    if (isTab(droppedBookmark)) {
      addNewBookmark({ ...droppedBookmark, tags: [...parentTags, name] });
    } else if (isBookmarkSchemaInCard(droppedBookmark) && droppedBookmark._cardTag !== name) {
      // existing bookmark, update details
      updateBookmark({
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
      syncBookmarks();
    }
  }
};

const handleDeleteTag = () => !untagged && deleteCard();

const styleDraggedBookmark = (element: HTMLElement | undefined) => {
  if (!element) return;
  modifyElementClasses(element, ["shadow-xl"]);
};

const handleAltKeyPressed = (event: KeyboardEvent) => {
  altKeyActive = event.altKey;
};
const untaggedHeaderStyle = "text-gray-200 dark:text-gray-700";
const taggedHeaderStyle = "text-gray-400 dark:text-gray-500";
</script>

<svelte:window onkeydown={handleAltKeyPressed} onkeyup={handleAltKeyPressed} />

<div class="flex flex-col bg-white shadow-gray-900 dark:bg-black dark:shadow-gray-50">
  {#if editMode && !untagged}
    <div class="ml-7 flex-shrink-0 py-3">
      <TagEditor
        deleteTag={handleDeleteTag}
        close={exitEditMode}
        bind:value={() => name, (newName: string) => renameCard(newName)}
        suggestedTags={$tagStore} />
    </div>
  {:else}
    <h3 class="ml-7 py-3 text-sm {untagged ? untaggedHeaderStyle : taggedHeaderStyle}">
      <a href="#edit-card-{name}" onclick={enterEditMode}>{name}</a>
      <span class="text-xs text-gray-300 dark:text-gray-600"> ({bookmarks.length})</span>
      {#if bookmarks.length > 1}
        <button class="text-xs text-gray-300 dark:text-gray-600" onclick={openAllBookmarks}>
          open all</button>
      {/if}
      <button class="text-gray-200 dark:text-gray-700" onclick={handleCreateNewCard}>+</button>
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
        description={bookmark.description}
        href={bookmark.href}
        key={bookmark.id}
        tags={bookmark.tags}
        favIconUrl={bookmark.favIconUrl}
        parentTags={[...parentTags, name]}
        highlightBookmark={() =>
          highlightBookmark(isBookmarkSchemaInCard(bookmark) ? bookmark._bookmarkId : bookmark.id)}
        closeBookmark={closeBookmarkDispatcher(bookmark.href)}
        openBookmark={() => newTab(bookmark.href)} />
    {/each}
  </div>
</div>
