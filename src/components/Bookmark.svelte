<script lang="ts" module>
interface Props {
  bookmark: BookmarkOrTab;
  parentTags?: string[];
  decay?: number;
  closeEnabled?: boolean;
  element?: HTMLDivElement;
  preview?: boolean;
  openBookmark?: () => void;
  closeBookmark?: () => void;
  highlightBookmark?: (key: string) => void;
}
interface DragState {
  state: "idle" | "in-flight";
  edge?: Edge;
}
</script>

<script lang="ts">
import type { BookmarkOrTab } from "@/lib/types";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { mount, unmount } from "svelte";

import Self from "./Bookmark.svelte";
import IconDelete from "./IconDelete.svelte";

let {
  bookmark,
  parentTags = [],
  preview = false,
  decay = 0,
  closeEnabled = true,
  element = $bindable(undefined),
  openBookmark = () => {},
  closeBookmark = () => {},
  highlightBookmark = () => {},
}: Props = $props();

const idle: DragState = { state: "idle" };
let dragState: DragState = $state(idle);

let sortedTags = $derived(
  bookmark.tags
    .map(tag => ({ name: tag, isParent: parentTags.includes(tag) }))
    .sort((a, b) => {
      if (a.isParent === b.isParent) {
        return a.name.localeCompare(b.name);
      } else if (a.isParent) {
        return 1;
      }
      return -1;
    })
);

const runOnClick = (callback: () => void) => (event: Event) => {
  event.stopPropagation();
  event.preventDefault();
  callback();
};

const runOnEnter = (callback: () => void) => (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    callback();
  }
};

const decayStyle = (): string => {
  if (decay <= 0.7) {
    return "low-decay";
  } else if (decay <= 0.9) {
    return "mid-decay";
  }
  return "high-decay";
};

$effect(() => {
  if (element) {
    draggable({
      element,
      canDrag: () => (element ? true : false),
      onDragStart: () => (dragState = { state: "in-flight" }),
      onDrop: () => (dragState = idle),
      getInitialData: () => ({ bookmark, type: "bookmark" }),
      onGenerateDragPreview({ nativeSetDragImage, location, source }) {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: preserveOffsetOnSource({
            element: source.element,
            input: location.current.input,
          }),
          render({ container }) {
            const preview = mount(Self, {
              target: container,
              props: { bookmark, preview: true, closeEnabled: false },
            });
            return () => unmount(preview);
          },
        });
      },
    });
  }
});
</script>

<div
  bind:this={element}
  role="button"
  tabindex="0"
  class={[
    "group/bookmark relative m-1.5 flex cursor-pointer flex-col bg-gray-50 p-1 shadow-gray-900 dark:bg-gray-900",
    dragState.state === "in-flight" && "in-flight",
    preview && "preview",
    "[&.in-flight]:opacity-40",
    "[&.preview]:w-50 [&.preview]:flex-none [&.preview]:opacity-100 [&.preview]:drop-shadow-lg",
  ]}
  onkeydown={runOnEnter(openBookmark)}
  onclick={runOnClick(openBookmark)}>
  {#if closeEnabled}
    <div class="z-10 -mb-5 ml-5 hidden h-5 flex-row justify-end pl-1 group-hover/bookmark:flex">
      <div
        role="button"
        tabindex="0"
        onkeydown={runOnEnter(closeBookmark)}
        onclick={runOnClick(closeBookmark)}
        class="group/close-button block cursor-pointer align-top text-sm text-red-300 hover:text-red-500">
        <IconDelete className="drop-shadow-sm group-hover/close-button:drop-shadow-lg" />
      </div>
    </div>
  {/if}
  <div class="flex grow flex-row">
    <div class="group/tooltip w-5 flex-none overflow-hidden pt-1 pr-1">
      {#if bookmark.favIconUrl}
        <img class="h-4 w-4" src={String(bookmark.favIconUrl)} alt={bookmark.description} />
      {:else}
        <div class="-mt-1 ml-1 h-4 w-4">
          <span
            role="button"
            tabindex="0"
            onkeydown={e => e.key === "Enter" && highlightBookmark(bookmark.id)}
            onclick={e => {
              e.stopPropagation();
              e.preventDefault();
              highlightBookmark(bookmark.id);
            }}
            class="block cursor-pointer align-top text-sm text-gray-200 group-hover/bookmark:text-blue-800 dark:text-gray-700 dark:group-hover/bookmark:text-blue-100"
            >¶</span>
        </div>
      {/if}
      {#if decay}
        <!-- tooltip -->
        <div
          class="{decayStyle()} absolute -bottom-9 z-10 mt-6 hidden flex-col items-center group-hover/tooltip:flex [&.high-decay]:-right-2 [&.low-decay]:left-1 [&.mid-decay]:left-10">
          <div
            class="{decayStyle()} -mb-2 h-3 w-3 rotate-45 [&.high-decay]:bg-red-200 [&.high-decay]:dark:bg-red-700 [&.low-decay]:bg-blue-200 [&.low-decay]:dark:bg-blue-700 [&.mid-decay]:bg-orange-200 [&.mid-decay]:dark:bg-orange-700">
          </div>
          <span
            class="{decayStyle()} whitespace-no-wrap relative p-2 text-xs leading-none shadow-lg [&.high-decay]:bg-red-200 [&.high-decay]:text-red-400 [&.high-decay]:dark:bg-red-700 [&.high-decay]:dark:text-red-500 [&.low-decay]:bg-blue-200 [&.low-decay]:text-blue-400 [&.low-decay]:dark:bg-blue-700 [&.low-decay]:dark:text-blue-500 [&.mid-decay]:bg-orange-200 [&.mid-decay]:text-orange-400 [&.mid-decay]:dark:bg-orange-700 [&.mid-decay]:dark:text-orange-500"
            >Decay: {Math.round(decay * 100)}%</span>
        </div>
      {/if}
    </div>
    <div class="flex-grow overflow-hidden">
      <p class="mt-0.5 truncate text-xs font-normal">
        {#if bookmark.description}{bookmark.description}{:else}{bookmark.href.hostname}{/if}
      </p>
      <p class="mb-0.5 truncate text-2xs font-extralight text-gray-300 dark:text-gray-600">
        <span class="font-normal">{bookmark.href.hostname}</span>{#if bookmark.href.port}:{bookmark
            .href.port}{/if}{bookmark.href.pathname}{bookmark.href.search}{bookmark.href.hash}
      </p>
      {#if sortedTags && bookmark.tags.length > 0}
        <p class="truncate text-xs font-extralight">
          {#each sortedTags as tag (tag.name)}
            <span
              class={[
                "inline-block border-b border-yellow-400 bg-yellow-50 px-1 text-yellow-500 dark:border-yellow-500 dark:bg-yellow-900 dark:text-yellow-500",
                tag.isParent && "parent",
                "[&.parent]:border-blue-400 [&.parent]:bg-blue-50 [&.parent]:text-blue-500 [&.parent]:dark:border-blue-500 [&.parent]:dark:bg-blue-900 [&.parent]:dark:text-blue-500",
              ]}>{tag.name}</span>
            <span> </span>
          {/each}
        </p>
      {/if}
    </div>
  </div>
  <div class="-m-1 mt-2 h-px shrink-0">
    <div class="w-full bg-gray-200 dark:bg-gray-700">
      <div
        class="{decayStyle()} h-px [&.high-decay]:bg-red-500 [&.high-decay]:dark:bg-red-400 [&.low-decay]:bg-blue-500 [&.low-decay]:dark:bg-blue-500 [&.mid-decay]:bg-orange-500 [&.mid-decay]:dark:bg-orange-400"
        style="width: {decay * 100}%">
      </div>
    </div>
  </div>
</div>
