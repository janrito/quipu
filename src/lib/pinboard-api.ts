import { storage } from "wxt/storage";

import type {
  BookmarkSchema,
  Parameters,
  PinBoardAPIBookmarkSchema,
  QuipuError,
  TagMap,
} from "./types.js";
import { encodeParameters, formatDate, yesterday } from "./utils.js";

const BOOKMARK_PREFIX = `quipu-bookmark`;

// TODO: subclass this error in order to enable error handling when appropriate
// e.g. a bookmark that already exists, which can be modified instead
export class PinboardAPIError extends Error implements QuipuError {
  name: string = "PinboardAPIError";
  status: number;

  constructor(status = -1, message?: string) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PinboardAPIError);
    }

    this.status = status;
  }
}

const handleRequestErrors = (response: Response) => {
  if (!response.ok) {
    throw new PinboardAPIError(response.status, response.statusText);
  }
  return response;
};

const fetchAPI = async (apiToken: string, route: string, parameters: Parameters = {}) => {
  const defaultParameters: Parameters = {
    format: "json",
    meta: 1,
  };

  const url = `https://api.pinboard.in/v1/${route}?auth_token=${apiToken}&${encodeParameters({
    ...defaultParameters,
    ...parameters,
  })}`;

  return fetch(url)
    .then(handleRequestErrors)
    .then(response => response.json());
};

// Represents a function that interacts with the Pinboard API
type PinboardFunction<TArgs extends unknown[], TReturn> = (
  apiToken: string,
  ...args: TArgs
) => Promise<TReturn>;

//  Authentication wrapper for Pinboard API calls
const auth = <TArgs extends unknown[], TReturn>(fn: PinboardFunction<TArgs, TReturn>) => {
  return async (apiToken: string, ...args: TArgs): Promise<TReturn> => {
    if (!apiToken) {
      throw new PinboardAPIError(-1, "Pinboard API Token does not exist");
    }

    return fn(apiToken, ...args);
  };
};

export const postsUpdate = auth(async apiToken =>
  fetchAPI(apiToken, "posts/update").then(data => new Date(data.update_time))
);

const cachedFetchAPI = async (apiToken: string, route: string, parameters: Parameters = {}) =>
  postsUpdate(apiToken).then(async lastUpdate => {
    const cacheKey = `${route}?${encodeParameters(parameters)}`;
    const cachedRoute = storage.defineItem<unknown, { lastUpdate: number; cachedOn: number }>(
      `session:${cacheKey}`
    );
    return cachedRoute
      .getMeta()
      .then(meta => {
        if (!meta.lastUpdate || !meta.cachedOn) {
          throw new Error("Invalid Metadata");
        }

        if (
          // data must be cached as of the last update reported by the API
          new Date(meta.lastUpdate).valueOf() !== lastUpdate.valueOf() ||
          // data must be cached for less than a day
          new Date(meta.cachedOn) < yesterday()
        ) {
          throw new Error("Expired Data");
        }
        // get cached data
        return cachedRoute.getValue().then(data => {
          if (data) {
            return data;
          }
          throw new Error("No Cached Data Found");
        });
      })
      .catch(() =>
        // if an error was thrown,
        // due to a missed cache, malformed data, or anything else,
        // request the data again
        fetchAPI(apiToken, route, parameters).then(data => {
          // cache data and set metadata
          Promise.all([
            cachedRoute.setValue(data),
            cachedRoute.setMeta({
              lastUpdate: lastUpdate.valueOf(),
              cachedOn: new Date().valueOf(),
            }),
          ]);
          return data;
        })
      );
  });

const preprocessTags = (tags: { [key: string]: number }): TagMap[] =>
  Object.entries(tags)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

export const tagsGet = auth(
  async (apiToken: string): Promise<TagMap[]> =>
    cachedFetchAPI(apiToken, "tags/get").then(preprocessTags)
);

export const preprocessBookmark = (data: PinBoardAPIBookmarkSchema[]): BookmarkSchema[] =>
  data.map((bookmarkData: PinBoardAPIBookmarkSchema, idx: number) => ({
    type: "Bookmark",
    ...bookmarkData,
    href: new URL(bookmarkData.href),
    _id: idx,
    id: `${BOOKMARK_PREFIX}-${idx}`,
    tags: bookmarkData.tags.split(" "),
    time: Date.parse(bookmarkData.time),
  }));

export const postsAll = auth(
  async (apiToken: string, tags: string[] = []): Promise<BookmarkSchema[]> =>
    cachedFetchAPI(apiToken, "posts/all", { tag: tags.filter(t => t) }).then(preprocessBookmark)
);

export const postsAdd = auth(
  async (
    apiToken: string,
    url: URL,
    description: string,
    extended: string = "",
    tags: string[] = [],
    replace: string = "yes"
  ): Promise<string> =>
    fetchAPI(apiToken, "posts/add", {
      url: String(url),
      description,
      extended,
      tags: tags.join(","),
      dt: formatDate(new Date()),
      shared: "no",
      replace,
    }).then(res => {
      const { result_code } = res;
      if (result_code !== "done") {
        throw new PinboardAPIError(-2, result_code);
      }
      return result_code;
    })
);

export const postsDelete = auth(async (apiToken: string, url: URL) =>
  fetchAPI(apiToken, "posts/delete", { url: String(url) }).then(res => {
    const { result_code } = res;
    if (result_code !== "done") {
      throw new PinboardAPIError(-2, result_code);
    }
    return result_code;
  })
);
