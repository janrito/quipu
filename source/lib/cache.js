import cache from "webext-storage-cache";

export const clearEntireCache = async () => {
  await cache.clear();
};
