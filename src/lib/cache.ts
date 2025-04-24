export const clearEntireCache = async () => {
  await storage.clear("local");
};
