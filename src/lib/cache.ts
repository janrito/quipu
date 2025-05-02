export const clearEntireCache = async () => {
  const storageType = "local";
  await storage.clear(storageType);
};
