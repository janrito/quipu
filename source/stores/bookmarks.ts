import { debounce, memoize } from "lodash";
import { writable } from "svelte/store";

import { PinboardAPIError, postsAdd, postsAll, postsDelete } from "../lib/pinboard-api.js";
import { BookmarksStore, GenericBookmarkSchema, TabBookmarkSchema } from "../lib/types.js";

const createBookmarksStore = (apiToken: string, tags: string[]) => {
  const initialValue: BookmarksStore = {
    data: [],
    loading: true,
    errors: [],
  };

  const { subscribe, update } = writable(initialValue);

  // debounce sync so that it does not sync more than once,
  // even if it is called repeatedly
  const sync = debounce(
    () => {
      // change the state to loading, but only if syncing is taking a while
      const showLoadingTimer = setTimeout(() => {
        update(currentValue => ({ ...currentValue, loading: true }));
      }, 3000);

      postsAll(apiToken, tags)
        .then(data => {
          // don't set loading if already received data
          clearTimeout(showLoadingTimer);

          update(currentValue => ({
            data: data,
            loading: false,
            errors: currentValue.errors,
          }));
        })
        .catch((e: PinboardAPIError) => {
          // clear loading timer on error
          clearTimeout(showLoadingTimer);

          update(currentValue => ({
            data: [],
            loading: false,
            // keep track of any errors in the loading of data
            errors: [e, ...currentValue.errors],
          }));
        });
    },
    100,
    // don't wait too long before syncing
    { maxWait: 300, leading: true }
  );

  const addBookmark = (newBookmark: TabBookmarkSchema) =>
    postsAdd(
      apiToken,
      newBookmark.href,
      newBookmark.description,
      newBookmark.extended,
      newBookmark.tags,
      "no"
    )
      .catch((e: PinboardAPIError) => {
        //add error to messages
        update(currentValue => ({ ...currentValue, errors: [e, ...currentValue.errors] }));
        // rethrow
        throw e;
      })
      .then(sync);

  const updateBookmark = (bookmark: GenericBookmarkSchema) =>
    postsAdd(apiToken, bookmark.href, bookmark.description, bookmark.extended, bookmark.tags, "yes")
      .catch((e: PinboardAPIError) => {
        //add error to messages
        update(currentValue => ({ ...currentValue, errors: [e, ...currentValue.errors] }));
        // rethrow
        throw e;
      })
      .then(sync);

  const deleteBookmark = (href: URL) =>
    postsDelete(apiToken, href)
      .catch((e: PinboardAPIError) => {
        //add error to messages
        update(currentValue => ({ ...currentValue, errors: [e, ...currentValue.errors] }));
        // rethrow
        throw e;
      })
      .then(sync);

  return { subscribe, addBookmark, updateBookmark, deleteBookmark, sync };
};

const memoizedCreateBookmarksStore = memoize(
  createBookmarksStore,
  (apiToken, tags) => `${apiToken}|${tags.join("+")}`
);

export default (apiToken: string, tags: string[]) => {
  // memoise store creation
  const store = memoizedCreateBookmarksStore(apiToken, tags);
  // but always sync
  store.sync();
  return store;
};
