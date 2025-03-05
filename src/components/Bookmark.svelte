<style>
@reference "../assets/main.pcss";
:global(#dnd-action-dragged-el) {
  @apply shadow-xl;
}
</style>

<script lang="ts">
import IconDelete from "./IconDelete.svelte";

interface Props {
  key: string;
  description: string;
  href: URL;
  tags?: string[];
  parentTags?: string[];
  favIconUrl?: URL;
  decay?: number;
  closeEnabled?: boolean;
  openBookmark: () => void;
  closeBookmark?: () => void;
  highlightBookmark?: (key: string) => void;
}

let {
  key,
  description,
  href,
  tags = [],
  parentTags = [],
  favIconUrl,
  decay = 0,
  closeEnabled = true,
  openBookmark,
  closeBookmark = () => {},
  highlightBookmark = () => {},
}: Props = $props();

let tagsToDraw = $derived(
  tags
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

const decayStyle = (lowProps: string, midProps: string, highProps: string): string => {
  if (decay <= 0.7) {
    return lowProps;
  } else if (decay <= 0.9) {
    return midProps;
  }
  return highProps;
};

const decayProgressBackground = decayStyle(
  "bg-blue-500 dark:bg-blue-500",
  "bg-orange-500 dark:bg-orange-400",
  "bg-red-500 dark:bg-red-400"
);

const tooltipBackground = decayStyle(
  "bg-blue-200 dark:bg-blue-700",
  "bg-orange-200 dark:bg-orange-700",
  "bg-red-200 dark:bg-red-700"
);
const tooltipForeground = decayStyle(
  "text-blue-400 dark:text-blue-500",
  "text-orange-400 dark:text-orange-500",
  "text-red-400 dark:text-red-500"
);
const tooltipAlignment = decayStyle("left-1", "left-10", "-right-2");
const parentTagStyle =
  "border-blue-400 bg-blue-50 text-blue-500 dark:border-blue-500 dark:bg-blue-900 dark:text-blue-500";
const leafTagStyle =
  "border-yellow-400 bg-yellow-50 text-yellow-500 dark:border-yellow-500 dark:bg-yellow-900 dark:text-yellow-500";
</script>

<div
  role="button"
  tabindex="0"
  class="group/bookmark relative m-1.5 flex cursor-pointer flex-col bg-gray-50 p-1 shadow-gray-900 dark:bg-gray-900"
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
      {#if favIconUrl}
        <img class="h-4 w-4" src={String(favIconUrl)} alt={description} />
      {:else}
        <div class="-mt-1 ml-1 h-4 w-4">
          <span
            role="button"
            tabindex="0"
            onkeydown={e => e.key === "Enter" && highlightBookmark(key)}
            onclick={e => {
              e.stopPropagation();
              e.preventDefault();
              highlightBookmark(key);
            }}
            class="block cursor-pointer align-top text-sm text-gray-200 group-hover/bookmark:text-blue-800 dark:text-gray-700 dark:group-hover/bookmark:text-blue-100"
            >¶</span>
        </div>
      {/if}
      {#if decay}
        <!-- tooltip -->
        <div
          class="absolute -bottom-9 z-10 hidden group-hover/tooltip:flex {tooltipAlignment} mt-6 flex-col items-center">
          <div class="-mb-2 h-3 w-3 rotate-45 {tooltipBackground}"></div>
          <span
            class="whitespace-no-wrap relative p-2 text-xs leading-none shadow-lg {tooltipBackground} {tooltipForeground}"
            >Decay: {Math.round(decay * 100)}%</span>
        </div>
      {/if}
    </div>
    <div class="flex-grow overflow-hidden">
      <p class="mt-0.5 truncate text-xs font-normal">
        {#if description}{description}{:else}{href.hostname}{/if}
      </p>
      <p class="mb-0.5 truncate text-2xs font-extralight text-gray-300 dark:text-gray-600">
        <span class="font-normal">{href.hostname}</span
        >{#if href.port}:{href.port}{/if}{href.pathname}{href.search}{href.hash}
      </p>
      {#if tagsToDraw && tags.length > 0}
        <p class="truncate text-xs font-extralight">
          {#each tagsToDraw as tag}
            <span class="inline-block border-b px-1 {tag.isParent ? parentTagStyle : leafTagStyle}"
              >{tag.name}</span>
            <span> </span>
          {/each}
        </p>
      {/if}
    </div>
  </div>
  <div class="-m-1 mt-2 h-px shrink-0">
    <div class="w-full bg-gray-200 dark:bg-gray-700">
      <div class="{decayProgressBackground} h-px" style="width: {decay * 100}%"></div>
    </div>
  </div>
</div>
