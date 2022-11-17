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
 * Pretty format a half life
 */
export const formatHalfLife = halfLifeInMilliseconds => {
  const halfLifeWeeks = Math.floor(halfLifeInMilliseconds / (1000 * 60 * 60 * 24 * 7));
  const halfLifeDays = Math.floor(
    halfLifeInMilliseconds / (1000 * 60 * 60 * 24) - halfLifeWeeks * 7
  );
  const halfLifeHours = Math.floor(
    halfLifeInMilliseconds / (1000 * 60 * 60) - (halfLifeWeeks * 24 * 7 + halfLifeDays * 24)
  );
  const halfLifeMinutes = Math.floor(
    halfLifeInMilliseconds / (1000 * 60) -
      (halfLifeWeeks * 60 * 24 * 7 + halfLifeDays * 60 * 24 + halfLifeHours * 60)
  );
  const halfLifeSeconds = Math.floor(
    halfLifeInMilliseconds / 1000 -
      (halfLifeWeeks * 60 * 60 * 24 * 7 +
        halfLifeDays * 60 * 60 * 24 +
        halfLifeHours * 60 * 60 +
        halfLifeMinutes * 60)
  );

  return [
    halfLifeWeeks ? `${halfLifeWeeks} week${halfLifeWeeks > 1 ? "s" : ""}` : "",
    halfLifeDays ? `${halfLifeDays} day${halfLifeDays > 1 ? "s" : ""}` : "",
    halfLifeHours ? `${halfLifeHours} hour${halfLifeHours > 1 ? "s" : ""}` : "",
    halfLifeMinutes ? `${halfLifeMinutes} minute${halfLifeMinutes > 1 ? "s" : ""}` : "",
    halfLifeSeconds ? `${halfLifeSeconds} second${halfLifeSeconds > 1 ? "s" : ""}` : "",
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
 * Samples whether to kill an object based on the probability of being alive
 * from a uniform distribution
 */
export const shouldKill = (lifetime, halfLife) => Math.random() > pAlive(lifetime, halfLife);
