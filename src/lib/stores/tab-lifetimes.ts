import { TAB_DECAY_LIFETIMES_CACHE_KEY, UPDATE_EVENT_TYPES } from "../constants.js";
import { tabLifetimesSchema } from "../types.js";
import cacheable from "./cacheable.js";

export default cacheable<tabLifetimesSchema>(TAB_DECAY_LIFETIMES_CACHE_KEY, UPDATE_EVENT_TYPES);
