import cacheable from "../lib/cacheable";
import { TAB_DECAY_LIFETIMES_CACHE_KEY, UPDATE_EVENT_TYPES } from "../lib/constants";
import { tabLifetimesSchema } from "../lib/types";

export default cacheable<tabLifetimesSchema>(TAB_DECAY_LIFETIMES_CACHE_KEY, UPDATE_EVENT_TYPES);
