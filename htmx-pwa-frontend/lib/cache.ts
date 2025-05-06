let cachePromise: Promise<Cache> | null = null;
const cacheName = 'tallyup-cache';
const cacheVersion = 'v1';
const cacheKey = `${cacheName}-${cacheVersion}`;

export const openCache = async (): Promise<Cache> => {
  if (cachePromise) return cachePromise;
  cachePromise = new Promise<Cache>((resolve, reject) => {
    const req = caches.open(cacheKey);
    req.then((cache) => resolve(cache)).catch((error) => reject(error));
  });
  return cachePromise;
};
