import memoize from "lodash/memoize";
import { URLPattern } from "urlpattern-polyfill";
import browser from "webextension-polyfill";

/**
 * Attempts to parse JSON from a string, otherwise returns false
 */
export const tryParseJSON = jsonString => {
  try {
    const o = JSON.parse(jsonString);
    if (o && typeof o === "object") {
      return o;
    }
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
export const encodeParameters = parameters =>
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
export const browserTabToBookmark = browserTab => ({
  description: browserTab.title,
  href: browserTab.url,
  favIcon: browserTab.favIconUrl,
  tags: "",
  time: formatDate(),
});

/**
 * Close a tab
 */
export const closeTab = tabId => {
  browser.tabs.remove(tabId);
};

/**
 * Switch to a tab
 */
export const switchToTab = tabId => {
  browser.tabs.update(tabId, { active: true });
};

/**
 *  Memoized get current tab
 * */

const currentTab = memoize(async () => await browser.tabs.getCurrent());

/**
 * Open a url in a new tab next to the current one
 */
export const newTab = async url => {
  browser.tabs.create({ url, active: false, index: (await currentTab()).index + 1 });
};

/**
 * Transforms an element by adding the classes in `add` and removing
 * the classes in `remove`.
 * It always returns the modified element
 */
export const modifyElementClasses = (element, add = [], remove = []) => {
  element.className = [
    ...new Set([...element.className.split(" ").filter(cls => !remove.includes(cls)), ...add]),
  ].join(" ");
  return element;
};

/**
 * Convert a strings into valid URLPattern
 */
export const compileURLPattern = line => {
  const trimmed = line.trim();
  if (trimmed.startsWith("//")) {
    // Ignore lines that start with double slashes
    return undefined;
  }
  try {
    // Attempt to create a pattern
    return new URLPattern(trimmed);
  } catch (error) {
    // Return undefined on failure
    return undefined;
  }
};

/**
 * Compile all valid URLPatterns from a list.
 * Discard any invalid ones and ones that start with `//
 */
export const compileValidURLPatterns = lines =>
  lines.map(compileURLPattern).filter(pattern => pattern);

/**
 * Test if URL matches pattern
 */
export const findURLPattern = (url, patterns) => patterns.find(pattern => pattern.test(url));

/**
 * Pretty format a half life
 */
export const formatTimeDelta = timeDeltaInMilliseconds => {
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
export const pAlive = (lifetime, halfLife) => 2 ** (-lifetime / halfLife);

/**
 * Samples a lifetime for half life
 * e.g. for a half life of 30 days it produces a random lifetime that equally likely
 * to be shorter than 30 days as is longer than 30 days
 */
export const sampleLifetime = halfLife => -(halfLife * Math.log2(Math.random()));
