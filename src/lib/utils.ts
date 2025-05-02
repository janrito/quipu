import { debounce, memoize } from "lodash";
import { URLPattern } from "urlpattern-polyfill";
import { browser } from "wxt/browser";

import { BROWSER_TAB_PREFIX } from "./constants.js";
import type {
  APIParameters,
  BookmarkOrTab,
  BookmarkSchema,
  BookmarkSchemaInCard,
  QuipuError,
  TabBookmarkSchema,
} from "./types.js";

/**
 * Attempts to parse JSON from a string, otherwise returns false
 */
export const tryParseJSONSettings = (jsonString: string) => {
  try {
    const o = JSON.parse(jsonString);
    if (o && typeof o === "object") return o;
  } catch {
    return false;
  }

  return false;
};

export const formatDate = (date = new Date()) => date.toISOString().replace(/\.\d{3}Z$/g, "Z");

/**
 * Returns a Date object representing yesterday's date at the current time
 * @returns {Date} A Date object set to 24 hours before the current time
 */
export const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
};

/**
 * Encodes keys and values to be passed as URL parameters as expected by
 * the pinboard API.
 * If multiple values in a key, they will be joined by a `+`
 */

export const encodeParameters = (parameters: APIParameters): string =>
  Object.entries(parameters)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=${value.map(v => encodeURIComponent(v)).join("+")}`;
      }

      return `${key}=${encodeURIComponent(value)}`;
    })
    .join("&");

export const randomSuffix = () => Math.round(Math.random() * 100000);

export class InvalidBookmark extends Error implements QuipuError {
  name: string = "InvalidBookmark";
  status: number;

  constructor(status = -1, message?: string) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidBookmark);
    }

    this.status = status;
  }
}

/**
 * Transforms a browser tab as returned from the `browser.tabs`
 * interface object to a bookmark object as expected by the pinboard API
 */

export const tabToTabBookMark = (
  tab: Browser.tabs.Tab,
  prefix: string = BROWSER_TAB_PREFIX
): TabBookmarkSchema => {
  let url = undefined;
  if (tab.url === undefined) {
    throw new InvalidBookmark(-1, "URL is undefined");
  }
  if (tab.id === undefined) {
    throw new InvalidBookmark(-1, "tab ID is undefined");
  }
  try {
    url = new URL(tab.url);
  } catch {
    throw new InvalidBookmark(-1, "tab ULR is invalid");
  }

  return {
    type: "Tab",
    id: `${prefix}-${tab.windowId || "[N]"}-${tab.id}`,
    tags: [],
    description: tab.title || "",
    href: url,
    favIconUrl: tab.favIconUrl ? new URL(tab.favIconUrl) : undefined,
    time: new Date().valueOf(),
    lastAccessed: tab.lastAccessed,
    windowId: tab.windowId || -1, // assign a negative window to a tab without window, this should not exist
    index: tab.index,
    browserTabId: tab.id,
  };
};

/**
 * Close a tab
 */
export const closeTab = (tab: Browser.tabs.Tab | TabBookmarkSchema) => {
  if (isTabBookmarkSchema(tab)) {
    browser.tabs.remove(tab.browserTabId);
  } else if (tab.id) {
    browser.tabs.remove(tab.id);
  }
};

/**
 * Switch to a window
 */
export const switchToWindow = (tab: TabBookmarkSchema) => {
  if (isTabBookmarkSchema(tab)) {
    browser.windows.update(tab.windowId, { focused: true });
  }
};

/**
 * Switch to a tab
 */
export const switchToTab = (tab: TabBookmarkSchema) => {
  if (isTabBookmarkSchema(tab)) {
    browser.tabs.update(tab.browserTabId, { active: true });
  }
};

/**
 *  Memoized get current tab
 * */

const currentTab = memoize(async () => await browser.tabs.getCurrent());

/**
 * Open a url in a new tab next to the current one
 */
export const newTab = async (url: URL) => {
  browser.tabs.create({
    url: String(url),
    active: false,
    index: ((await currentTab())?.index || 0) + 1,
  });
};

/**
 * Transforms an element by adding the classes in `add` and removing
 * the classes in `remove`.
 * It always returns the modified element
 */
export const modifyElementClasses = (
  element: HTMLElement,
  add: string[] = [],
  remove: string[] = []
) => {
  element.className = [
    ...new Set([...element.className.split(" ").filter(cls => !remove.includes(cls)), ...add]),
  ].join(" ");
  return element;
};

/**
 * Convert a strings into valid URLPattern
 */
export const compileURLPattern = (line: string) => {
  const trimmed = line.trim();
  if (trimmed.startsWith("//")) {
    // Ignore lines that start with double slashes
    return undefined;
  }
  try {
    // Attempt to create a pattern
    return new URLPattern(trimmed);
  } catch {
    // Return undefined on failure
    return undefined;
  }
};

/**
 * Compile all valid URLPatterns from a list.
 * Discard any invalid ones and ones that start with `//
 */
export const compileValidURLPatterns = (lines: string[]): URLPattern[] =>
  lines.map(compileURLPattern).filter(pattern => pattern) as URLPattern[];

/**
 * Test if URL matches pattern
 */
export const findURLPattern = (url: URL | string, patterns: URLPattern[]): URLPattern =>
  (url ? patterns.find(pattern => pattern.test(url)) : undefined) as URLPattern;
/**
 * Pretty format a half life
 */
export const formatTimeDelta = (timeDeltaInMilliseconds: number) => {
  const timeDeltaInWeeks = Math.floor(timeDeltaInMilliseconds / (1000 * 60 * 60 * 24 * 7));
  const timeDeltaInDays = Math.floor(
    timeDeltaInMilliseconds / (1000 * 60 * 60 * 24) - timeDeltaInWeeks * 7
  );
  const timeDeltaInHours = Math.floor(
    timeDeltaInMilliseconds / (1000 * 60 * 60) - (timeDeltaInWeeks * 24 * 7 + timeDeltaInDays * 24)
  );
  const timeDeltaInMinutes = Math.floor(
    timeDeltaInMilliseconds / (1000 * 60) -
      (timeDeltaInWeeks * 60 * 24 * 7 + timeDeltaInDays * 60 * 24 + timeDeltaInHours * 60)
  );
  const timeDeltaInSeconds = Math.floor(
    timeDeltaInMilliseconds / 1000 -
      (timeDeltaInWeeks * 60 * 60 * 24 * 7 +
        timeDeltaInDays * 60 * 60 * 24 +
        timeDeltaInHours * 60 * 60 +
        timeDeltaInMinutes * 60)
  );

  return [
    timeDeltaInWeeks ? `${timeDeltaInWeeks} week${timeDeltaInWeeks > 1 ? "s" : ""}` : "",
    timeDeltaInDays ? `${timeDeltaInDays} day${timeDeltaInDays > 1 ? "s" : ""}` : "",
    timeDeltaInHours ? `${timeDeltaInHours} hour${timeDeltaInHours > 1 ? "s" : ""}` : "",
    timeDeltaInMinutes ? `${timeDeltaInMinutes} minute${timeDeltaInMinutes > 1 ? "s" : ""}` : "",
    timeDeltaInSeconds ? `${timeDeltaInSeconds} second${timeDeltaInSeconds > 1 ? "s" : ""}` : "",
  ]
    .filter(a => a)
    .join(", ");
};

/**
 * Calculates the probability of being alive of an object based on it's lifetime and
 * half life
 * e.g. the probability of being alive with lifetime of 20, and a half-life of 20
 * should be 50%
 */
export const pAlive = (lifetime: number, halfLife: number) => 2 ** (-lifetime / halfLife);

/**
 * Samples a lifetime for half life
 * e.g. for a half life of 30 days it produces a random lifetime that equally likely
 * to be shorter than 30 days as is longer than 30 days
 */
export const sampleLifetime = (halfLife: number) => -Math.ceil(halfLife * Math.log2(Math.random()));

/**
 * Calculate delay
 */
export const calculateDelay = (lifetime: number, lastAccessed?: number | undefined) => {
  const now = new Date().valueOf();
  const currentLifeSpan = lastAccessed ? (now - lastAccessed).valueOf() : 0;
  return lifetime - currentLifeSpan > 0 ? lifetime - currentLifeSpan : 0;
};
/**
 * Memoizes and debounces a function.
 *
 * This function combines memoization and debouncing.
 * So that the function is only called once with the same arguments
 * but it is called multiple times with different arguments
 * Mostly adapted from:
 * https://docs.actuallycolab.org/engineering-blog/memoize-debounce/
 * https://github.com/lodash/lodash/issues/2403
 *
 * @param func The function to memoize and debounce.
 * @param wait The number of milliseconds to delay for the debounce function.
 * @param options The options for the debounce function.
 * @param resolver The resolver for the memoize function.
 * @returns A memoized and debounced function.
 */
export function memoizeDebounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  wait = 0,
  options?: Parameters<typeof debounce<F>>[2],
  resolver?: Parameters<
    typeof memoize<(...args: Parameters<F>) => ReturnType<typeof debounce<F>>>
  >[1]
) {
  const mem = memoize<(...args: Parameters<F>) => ReturnType<typeof debounce<F>>>(function () {
    return debounce<F>(func, wait, options);
  }, resolver);

  return function (...args: Parameters<F>) {
    return mem(...args)(...args);
  };
}

/**
 * Convert between tab id (numeric) and lifetime id (strings)
 * tab ids are stored by the browser, we need to use them to interact with a tab
 * lifetime ids are stored in the cache in an object they have to be strings
 */
export const lifetimeIdToTabId = (lifetimeId: string) => Number(lifetimeId);
export const tabIdToLifetimeId = (tabId: number) => String(tabId);

export const getTabLifetimeId = (tab: Browser.tabs.Tab | TabBookmarkSchema): string | undefined => {
  if (isTabBookmarkSchema(tab)) {
    return String(tab.browserTabId);
  } else if (tab.id) {
    return String(tab.id);
  }
};

const _isObj = (obj: unknown): obj is object => {
  return typeof obj === "object" && obj !== null;
};

/**
 * Type guard to determine if an object is a TabBookmarkSchema
 */
export const isTabBookmarkSchema = (obj: unknown): obj is TabBookmarkSchema => {
  return _isObj(obj) && "type" in obj && obj.type === "Tab";
};

/**
 * Type guard to determine if an object is a TabBookmarkSchema
 */
export const isBookmarkSchema = (obj: unknown): obj is BookmarkSchema => {
  return _isObj(obj) && "type" in obj && obj.type === "Bookmark";
};

/**
 * Type guard to determine if an object is a BookmarkOrTab
 */
export const isBookmarkOrTab = (obj: unknown): obj is BookmarkOrTab => {
  return isTabBookmarkSchema(obj) || isBookmarkSchema(obj);
};

/**
 * Type guard to determine if an object is a BookmarkSchemaInCard
 */
export const isBookmarkSchemaInCard = (obj: unknown): obj is BookmarkSchemaInCard => {
  return isBookmarkSchema(obj) && "_cardTag" in obj;
};
