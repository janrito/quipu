import cacheable from "../lib/cacheable";
import { TAB_DECAY_LIFETIMES_CACHE_KEY, UPDATE_EVENT_TYPES } from "../lib/constants";

export default cacheable(TAB_DECAY_LIFETIMES_CACHE_KEY, UPDATE_EVENT_TYPES);
