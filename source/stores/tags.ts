import memoize from "lodash/memoize";
import { readable } from "svelte/store";

import { tagsGet } from "../lib/pinboard-api";

interface TagMap {
  name: string;
  count: number;
}

const preprocessTags = (tags: { [key: string]: number }): TagMap[] =>
  Object.entries(tags)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

const createTagStore = (apiKey: string) => {
  const initialValue: TagMap[] = [];
  return readable(initialValue, set => {
    tagsGet(apiKey).then(data => set(preprocessTags(data)));
  });
};

export default memoize(createTagStore);
