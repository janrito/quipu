export type ParameterValue = Array<boolean | number | string> | boolean | number | string;
export type Parameters = {
  [key: string]: ParameterValue;
};

export interface PageSchema {
  name: string;
  cards: string[];
}

export interface AppSettingsSchema {
  pinboardAPIToken: string;
  pinboardRootTag: string;
  pages: PageSchema[];
  tabDecayHalfLife: number;
  tabDecayExceptions: string[];
}

export interface QuipuError extends Error {
  status: number;
}

interface BookmarkSchemaBase {
  href: URL;
  description: string;
  favIconUrl?: URL;
  extended?: string;
  tags: string[];
  time: number;
  id: string;
  _id: number;
}

export interface BookmarkSchema extends BookmarkSchemaBase {
  type: "Bookmark";
}
export interface BookmarkSchemaInCard extends BookmarkSchema {
  _cardTag: string;
  _bookmarkId: string;
}

export interface TabBookmarkSchema extends BookmarkSchemaBase {
  type: "Tab";
  lastAccessed?: number;
  windowId: number;
  index: number;
}
export type BookmarkOrTab = BookmarkSchema | TabBookmarkSchema;

export type SerializedTabBookmarkSchema = Omit<TabBookmarkSchema, "favIconUrl" | "href"> & {
  href: string;
  favIconUrl?: string;
};

export interface BookmarksStore {
  data: BookmarkSchema[];
  loading: boolean;
  errors: QuipuError[];
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
