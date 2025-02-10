import browser from "webextension-polyfill";

export type ParameterValue = Array<boolean | number | string> | boolean | number | string;
export type Parameters = {
  [key: string]: ParameterValue;
};

export type BrowserTab = browser.Tabs.Tab & { _id: number; id: string };

export interface PagesSchema {
  name: string;
  cards: string[];
}

export interface AppSettingsSchema {
  pinboardAPIToken: string;
  pinboardRootTag: string;
  pages: PagesSchema[];
  tabDecayHalfLife: number;
  tabDecayExceptions: string[];
}

export interface EncodedAppSettingsSchema {
  pinboardAPIToken: string;
  pinboardRootTag: string;
  pages: string;
  tabDecayHalfLife: number;
  tabDecayExceptions: string;
}

export interface BookmarkSchema {
  href: URL;
  description: string;
  extended: string;
  tags: string[];
  time: number;
  id: string;
}
export interface BookmarksStore {
  data: BookmarkSchema[];
  loading: boolean;
  errors: Error[];
}

export interface PinBoardAPIBookmarkSchema {
  href: URL;
  description: string;
  extended: string;
  tags: string;
  time: string;
}

export interface TagMap {
  name: string;
  count: number;
}

export interface TabLifetimeSchema {
  timerId?: ReturnType<typeof setTimeout>;
  lifetime: number;
}

export interface tabLifetimesSchema {
  [lifetimeId: string]: TabLifetimeSchema;
}

export type BrowserEventType = "updatedSettings";

export interface BrowserMessage {
  eventType: BrowserEventType;
}
