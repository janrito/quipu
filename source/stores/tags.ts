import { memoize } from "lodash";
import { readable } from "svelte/store";

import { tagsGet } from "../lib/pinboard-api.js";
import { TagMap } from "../lib/types.js";

const createTagStore = (apiKey: string) => {
  const initialValue: TagMap[] = [];
  return readable(initialValue, set => {
    tagsGet(apiKey).then(data => set(data));
  });
};

export default memoize(createTagStore);
