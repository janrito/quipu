import cacheable from "../lib/cacheable.js";
import { TAB_DECAY_LIFETIMES_CACHE_KEY, UPDATE_EVENT_TYPES } from "../lib/constants.js";
import { tabLifetimesSchema } from "../lib/types.js";

export default cacheable<tabLifetimesSchema>(TAB_DECAY_LIFETIMES_CACHE_KEY, UPDATE_EVENT_TYPES);
