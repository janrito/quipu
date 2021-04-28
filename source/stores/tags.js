import { readable } from "svelte/store";
import memoize from "lodash/memoize";

import { tagsGet } from "../lib/pinboard-api.js";

const preprocessTags = tags =>
  Object.entries(tags)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
const createTagStore = apiKey =>
  readable([], set => {
    tagsGet(apiKey).then(data => set(preprocessTags(data)));
  });

export default memoize(createTagStore);
