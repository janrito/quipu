import { storage } from "wxt/storage";

export const clearEntireCache = async () => {
  await storage.clear("local");
};
