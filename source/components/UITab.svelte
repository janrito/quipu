<script lang="ts">
import type { TagMap } from "../lib/types.js";
import TagEditor from "./TagEditor.svelte";

interface Props {
  label: string;
  selected?: boolean;
  editable?: boolean;
  suggestedTags?: TagMap[];
  deleteTab?: () => void;
  renameTab?: (newTabName: string) => void;
}

let {
  label,
  selected = $bindable(false),
  editable = false,
  suggestedTags = [],
  deleteTab = () => {},
  renameTab = () => {},
}: Props = $props();

let editMode: boolean = $state(false);

const handleClick = (event: Event) => {
  event.preventDefault();
  if (selected && editable) {
    editMode = true;
  } else if (!selected) {
    selected = true;
  }
};

const tabHeadingStyle = "border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500";
const selectedTabHeadingStyle =
  "border-gray-600 text-gray-800 dark:border-gray-300 dark:text-gray-200";
</script>

{#if editable && editMode && selected}
  <TagEditor
    deleteTag={deleteTab}
    close={() => (editMode = false)}
    bind:value={() => label, newName => renameTab(newName)}
    {suggestedTags} />
{:else}
  <a
    href="#page-{label}"
    class="{selected ? selectedTabHeadingStyle : tabHeadingStyle}
      mx-0 mt-0 -mb-0.5 truncate border-b-2 bg-white px-3 text-sm font-extralight hover:border-gray-400 dark:bg-black hover:dark:border-gray-500"
    onclick={handleClick}>{label}</a>
{/if}
