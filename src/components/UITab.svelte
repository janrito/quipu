<script lang="ts" module>
interface Props {
  label: string;
  selected?: boolean;
  editable?: boolean;
  preview?: boolean;
  deleteTab?: () => void;
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
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { mount, unmount } from "svelte";
import type { Action } from "svelte/action";

import TagEditor from "./TagEditor.svelte";
import UITab from "./UITab.svelte";

let {
  label = $bindable(),
  selected = $bindable(false),
  editable = false,
  preview = false,
  deleteTab = () => {},
}: Props = $props();

const idle: DragState = { state: "idle" };
let dragState: DragState = $state(idle);

let editMode: boolean = $state(false);

const handleClick = (event: Event) => {
  event.preventDefault();
  if (selected && editable) {
    editMode = true;
  } else if (!selected) {
    selected = true;
  }
};

const reorderable: Action = (node: HTMLElement) => {
  $effect(() => {
    draggable({
      element: node,
      canDrag: () => (editable && !editMode ? true : false),
      onDragStart: () => (dragState = { state: "in-flight" }),
      onDrop: () => (dragState = idle),
      getInitialData: () => ({ label, type: "UITab" }),
      onGenerateDragPreview({ nativeSetDragImage, location, source }) {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: preserveOffsetOnSource({
            element: source.element,
            input: location.current.input,
          }),
          render({ container }) {
            const app = mount(UITab, {
              target: container,
              props: { label: label, selected: selected, preview: true },
            });
            return () => unmount(app);
          },
        });
      },
    });
    dropTargetForElements({
      element: node,
      getIsSticky: () => true,
      canDrop: ({ source }) => source.data.type === "UITab" && source.data.label !== label,
      getData: ({ input }) =>
        attachClosestEdge(
          { label, type: "UITab" },
          {
            element: node,
            input,
            allowedEdges: ["left", "right"],
          }
        ),
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
</script>

{#snippet indicator(edge: Edge | undefined, side: Edge)}
  {#if edge === side}
    <div class="width-2 background-gray-500 h-full rounded-xl border-2 border-blue-300"></div>
  {/if}
{/snippet}

{#if editable && editMode && selected}
  <TagEditor deleteTag={deleteTab} close={() => (editMode = false)} bind:value={label} />
{:else}
  {@render indicator(dragState.edge, "left")}
  <a
    use:reorderable
    href="#page-{label}"
    class={[
      "mx-0 mt-0 cursor-pointer truncate border-b-2 border-gray-300 bg-white px-3 pb-1 text-sm font-extralight text-gray-400 hover:border-gray-400 dark:border-gray-600 dark:bg-black dark:text-gray-500 hover:dark:border-gray-500",
      "in-flight:opacity-40",
      "preview:cursor-grabbing preview:pt-1 preview:pb-2 preview:drop-shadow-lg",
      "selected:border-gray-600 selected:text-gray-800 selected:dark:border-gray-300 selected:dark:text-gray-200",
      dragState.state === "in-flight" && "in-flight",
      selected && "selected",
      preview && "preview",
    ]}
    onclick={handleClick}>{label}</a>
  {@render indicator(dragState.edge, "right")}
{/if}
