<script lang="ts" module>
interface Props {
  name: string;
  bookmarks?: BookmarkSchema[];
  parentTags?: string[];
  untagged?: boolean;
  editMode?: boolean;
  deleteBookmark: (href: URL) => void;
  highlightBookmark: (bookmarkId: string) => void;
  syncBookmarks: () => void;
  renameCard?: (newName: string) => void;
  deleteCard?: () => void;
  createNewCard: () => void;
}

interface DragState {
  state: "dragged-over" | "idle" | "in-flight";
  edge?: Edge;
}
</script>

<script lang="ts">
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Action } from "svelte/action";

import type { BookmarkSchema } from "~/lib/types.js";

import { isBookmarkSchema, isBookmarkSchemaInCard, newTab } from "../lib/utils.js";
import Bookmark from "./Bookmark.svelte";
import TagEditor from "./TagEditor.svelte";

let {
  name,
  bookmarks = $bindable([]),
  parentTags = [],
  untagged = false,
  editMode = $bindable(false),
  deleteBookmark,
  highlightBookmark,
  renameCard = () => {},
  deleteCard = () => {},
  createNewCard,
}: Props = $props();

const idle: DragState = { state: "idle" };
let dragState: DragState = $state(idle);

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
    editMode = false;
  }
};

const handleCreateNewCard = (event: Event) => {
  event.preventDefault();
  createNewCard();
};

const draggableCard: Action = (node: HTMLElement) => {
  $effect(() => {
    draggable({
      element: node,
      canDrag: () => (!untagged ? true : false),
      onDragStart: () => (dragState = { state: "in-flight" }),
      onDrop: () => (dragState = idle),
      getInitialData: () => ({ name: name, type: "card" }),
    });
  });
};

const droppableCard: Action = (node: HTMLElement) => {
  $effect(() => {
    dropTargetForElements({
      element: node,
      getIsSticky: ({ source }) => {
        if (source.data.type === "card") {
          // we want stickiness when reorganising a card
          return true;
        }
        // but not when dragging a bookmark
        return false;
      },
      canDrop: ({ source }) => {
        if (source.data.type === "card" && source.data.name !== name) {
          return true;
        }
        if (source.data.type === "bookmark") {
          return true;
        }
        return false;
      },
      getDropEffect: ({ input, source }) => {
        if (input.altKey && isBookmarkSchema(source.data.bookmark)) {
          return "copy";
        }
        return "move";
      },
      getData: ({ input, source }) => {
        const initialData = { name: name, type: "card" };
        if (source.data.type === "bookmark") {
          return initialData;
        }
        return attachClosestEdge(initialData, {
          element: node!,
          input,
          allowedEdges: ["top", "bottom"],
        });
      },
      onDragEnter: ({ self }) => {
        dragState = { state: "dragged-over", edge: extractClosestEdge(self.data) || undefined };
      },
      onDrag: ({ self }) => {
        const closestEdge = extractClosestEdge(self.data);

        if (dragState.state === "dragged-over" && closestEdge && dragState.edge !== closestEdge) {
          dragState = { ...dragState, edge: closestEdge };
        }
      },

      onDragLeave: () => (dragState = idle),
      onDrop: () => (dragState = idle),
    });
  });
};

const handleDeleteTag = () => !untagged && deleteCard();
</script>

{#snippet indicator(edge: Edge | undefined, side: Edge)}
  {#if edge === side}
    <div class="background-gray-500 flex flex-col rounded-xl border-2 border-blue-300"></div>
  {/if}
{/snippet}

{@render indicator(dragState.edge, "top")}

<div
  use:draggableCard
  use:droppableCard
  class={[
    "flex flex-col",
    "in-flight:opacity-40",
    "dragged-over:bg-gray-50 dragged-over:dark:bg-gray-950",
    dragState.state === "dragged-over" && dragState.edge === undefined && "dragged-over",
    dragState.state === "in-flight" && "in-flight",
  ]}>
  {#if editMode && !untagged}
    <div class="ml-7 flex-shrink-0 py-3">
      <TagEditor
        deleteTag={handleDeleteTag}
        close={exitEditMode}
        bind:value={() => name, (newName: string) => renameCard(newName)} />
    </div>
  {:else}
    <h3
      class={[
        "ml-7 py-3 text-sm text-gray-400 dark:text-gray-500",
        untagged && "untagged",
        "untagged:text-gray-200 untagged:dark:text-gray-700",
      ]}>
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
    style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))">
    {#each bookmarks as bookmark (bookmark.id)}
      <Bookmark
        {bookmark}
        parentTags={[...parentTags, name]}
        highlightBookmark={() =>
          highlightBookmark(isBookmarkSchemaInCard(bookmark) ? bookmark._bookmarkId : bookmark.id)}
        closeBookmark={closeBookmarkDispatcher(bookmark.href)}
        openBookmark={() => newTab(bookmark.href)} />
    {/each}
  </div>
</div>
{@render indicator(dragState.edge, "bottom")}
