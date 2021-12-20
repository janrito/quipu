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
});

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
