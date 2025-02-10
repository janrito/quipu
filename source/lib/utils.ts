import memoize from "lodash/memoize";
import { URLPattern } from "urlpattern-polyfill";
import browser from "webextension-polyfill";

import { BrowserMessage, Parameters } from "./types";

/**
 * Attempts to parse JSON from a string, otherwise returns false
 */
export const tryParseJSON = (jsonString: string) => {
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
 * Encodes keys and values to be passed as URL parameters as expected by
 * the pinboard API.
 * If multiple values in a key, they will be joined by a `+`
 */

export const encodeParameters = (parameters: Parameters): string =>
  Object.entries(parameters)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=${value.map(v => encodeURIComponent(v)).join("+")}`;
      }

      return `${key}=${encodeURIComponent(value)}`;
    })
    .join("&");

export const randomSuffix = () => Math.round(Math.random() * 100000);

/**
 * Transforms a browser tab as returned from the `browser.tabs`
 * interface object to a bookmark object as expected by the pinboard API
 */
export const browserTabToBookmark = (browserTab: browser.Tabs.Tab) => ({
  description: browserTab.title,
  href: browserTab.url,
  favIcon: browserTab.favIconUrl,
  tags: "",
  time: formatDate(),
});

/**
 * Close a tab
 */
export const closeTab = (tabId: number) => {
  browser.tabs.remove(tabId);
};

/**
 * Switch to a window
 */
export const switchToWindow = (windowId: number) => {
  browser.windows.update(windowId, { focused: true });
};

/**
 * Switch to a tab
 */
export const switchToTab = (tabId: number) => {
  browser.tabs.update(tabId, { active: true });
};

/**
 *  Memoized get current tab
 * */

const currentTab = memoize(async () => await browser.tabs.getCurrent());

/**
 * Open a url in a new tab next to the current one
 */
export const newTab = async (url: string) => {
  browser.tabs.create({ url, active: false, index: (await currentTab()).index + 1 });
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
export const findURLPattern = (url: string, patterns: URLPattern[]): URLPattern =>
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
export const sampleLifetime = (halfLife: number) => -(halfLife * Math.log2(Math.random()));

/**
 * Calculate delay
 */
export const calculateDelay = (lifetime: number, lastAccessed?: number | undefined) => {
  const now = new Date().valueOf();
  const currentLifeSpan = lastAccessed ? (now - lastAccessed).valueOf() : 0;
  return lifetime - currentLifeSpan > 0 ? lifetime - currentLifeSpan : 0;
};

/**
 * Convert between tab id (numeric) and lifetime id (strings)
 * tab ids are stored by the browser, we need to use them to interact with a tab
 * lifetime ids are stored in the cache in an object they have to be strings
 */
export const lifetimeIdToTabId = (lifetimeId: string) => Number(lifetimeId);
export const tabIdToLifetimeId = (tabId: number) => String(tabId);

/** Check if an object of type unknown, is in fact a BrowserMessage
 *
 */
export const isBrowserMessage = (message: unknown): message is BrowserMessage => {
  return (message && typeof message === "object" && "eventType" in message) as boolean;
};
