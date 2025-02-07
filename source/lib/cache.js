import cache from "webext-storage-cache/legacy.js";

export const clearEntireCache = async () => {
  await cache.clear();
};
