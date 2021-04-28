import { writable } from "svelte/store";
import debounce from "lodash/debounce";
import memoize from "lodash/memoize";

import { postsAll, postsAdd, postsDelete } from "../lib/pinboard-api.js";

const BOOKMARK_PREFIX = `quipu-bookmark`;
const preprocessBookmark = data =>
  data.map((bookmark, idx) => ({
    ...bookmark,
    id: `${BOOKMARK_PREFIX}-${idx}`,
    tags: bookmark.tags.split(" "),
  }));

const createBookmarksStore = (apiToken, tags) => {
  let initialValue = {
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
            data: preprocessBookmark(data),
            loading: false,
            errors: currentValue.errors,
          }));
        })
        .catch(e => {
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

  const addBookmark = newBookmark =>
    postsAdd(
      apiToken,
      newBookmark.href,
      newBookmark.description,
      newBookmark.extended,
      newBookmark.tags,
      "no"
    )
      .catch(e => {
        //add error to messages
        update(currentValue => ({ ...currentValue, errors: [e, ...currentValue.errors] }));
        // rethrow
        throw e;
      })
      .then(sync);

  const updateBookmark = bookmark =>
    postsAdd(apiToken, bookmark.href, bookmark.description, bookmark.extended, bookmark.tags, "yes")
      .catch(e => {
        //add error to messages
        update(currentValue => ({ ...currentValue, errors: [e, ...currentValue.errors] }));
        // rethrow
        throw e;
      })
      .then(sync);

  const deleteBookmark = bookmark =>
    postsDelete(apiToken, bookmark.href)
      .catch(e => {
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

export default (apiToken, tags) => {
  // memoise store creation
  const store = memoizedCreateBookmarksStore(apiToken, tags);
  // but always sync
  store.sync();
  return store;
};
