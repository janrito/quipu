import memoize from "lodash/memoize";
import { readable } from "svelte/store";

import { tagsGet } from "../lib/pinboard-api";
import { TagMap } from "../lib/types";

const createTagStore = (apiKey: string) => {
  const initialValue: TagMap[] = [];
  return readable(initialValue, set => {
    tagsGet(apiKey).then(data => set(data));
  });
};

export default memoize(createTagStore);
