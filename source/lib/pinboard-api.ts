import cache from "webext-storage-cache/legacy.js";

import { encodeParameters, formatDate, Parameters } from "./utils";

// TODO: subclass this error in order to enable error handling when appropriate
// e.g. a bookmark that already exists, which can be modified instead
class PinboardAPIError extends Error {
  status: number;
  description: string;
  constructor(status = -1, description = "Unknown Error", message?: string) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PinboardAPIError);
    }

    this.name = "PinboardAPIError";
    this.status = status;
    this.description = description;
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
  fetchAPI(apiToken, "posts/update").then(data => data.update_time)
);

const cachedFetchAPI = async (apiToken: string, route: string, parameters: Parameters = {}) =>
  postsUpdate(apiToken).then(async lastUpdate => {
    const cacheKey = `${lastUpdate}||${route}?${encodeParameters(parameters)}`;
    return cache.get(cacheKey).then(data => {
      if (data) {
        return data;
      }
      return fetchAPI(apiToken, route, parameters).then(data =>
        cache.set(cacheKey, data, { days: 1 })
      );
    });
  });

export const tagsGet = auth(
  async (apiToken: string): Promise<{ [key: string]: number }> =>
    cachedFetchAPI(apiToken, "tags/get")
);

export interface RawBookmarkSchema {
  href: URL;
  description: string;
  extended: string;
  tags: string;
  time: string;
}

export const postsAll = auth(
  async (apiToken: string, tags: string[] = []): Promise<RawBookmarkSchema[]> => {
    return cachedFetchAPI(apiToken, "posts/all", { tag: tags.filter(t => t) });
  }
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
