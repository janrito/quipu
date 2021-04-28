import cache from "webext-storage-cache";
import { encodeParameters } from "./utils.js";

// TODO: sublcass this error in order to enable error handling when appropriate
// e.g. a bookmark that already exists, which can be modified instead
class PinboardAPIError extends Error {
  constructor(status = -1, description = "Unknown Error", ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PinboardAPIError);
    }

    this.name = "PinboardAPIError";
    this.status = status;
    this.description = description;
  }
}

const handleRequestErrors = response => {
  if (!response.ok) {
    throw new PinboardAPIError(response.status, response.statusText);
  }
  return response;
};

const fetchAPI = async (apiToken, route, parameters = {}) => {
  const defaultParameters = {
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

const cachedFetchAPI = async (apiToken, route, parameters = {}) =>
  postsUpdate(apiToken).then(lastUpdate => {
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

const auth = fn => (apiToken, ...args) => {
  if (!apiToken) {
    return new Promise((_, reject) =>
      reject(new PinboardAPIError(-1, "Pinboard API Token does not exist"))
    );
  }
  return fn(apiToken, ...args);
};

export const postsUpdate = auth(async apiToken =>
  fetchAPI(apiToken, "posts/update").then(data => data.update_time)
);

export const tagsGet = auth(async apiToken => cachedFetchAPI(apiToken, "tags/get"));

export const postsAll = auth(async (apiToken, tags = []) =>
  cachedFetchAPI(apiToken, "posts/all", { tag: tags.filter(t => t) })
);

export const postsAdd = auth(
  async (apiToken, url, description, extended = "", tags = [], replace = "yes") =>
    fetchAPI(apiToken, "posts/add", {
      url,
      description,
      extended,
      tags,
      replace,
      shared: "no",
    }).then(res => {
      const { result_code } = res;
      if (result_code !== "done") {
        throw new PinboardAPIError(-2, result_code);
      }
      return result_code;
    })
);

export const postsDelete = auth(async (apiToken, url) =>
  fetchAPI(apiToken, "posts/delete", { url }).then(res => {
    const { result_code } = res;
    if (result_code !== "done") {
      throw new PinboardAPIError(-2, result_code);
    }
    return result_code;
  })
);
