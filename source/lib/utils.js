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

export const browserTabToBookmark = browserTab => ({
  description: browserTab.title,
  href: browserTab.url,
  favIcon: browserTab.favIconUrl,
  tags: "",
});
