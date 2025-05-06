import { openCache } from './cache';

const oldFetch = self.fetch;

export const fetch = async (
  ...params: Parameters<typeof oldFetch>
): Promise<ReturnType<typeof oldFetch>> => {
  try {
    return await oldFetch(...params);
  } catch (error) {
    console.error('Fetch error:', error);
    const cache = await openCache();
    const cachedResponse = await cache.match(params[0]);
    if (cachedResponse) {
      console.log('Returning cached response:', cachedResponse);
      return cachedResponse;
    } else {
      console.error('No cached response found for:', params[0]);
      throw error; // Re-throw the error if no cached response is found
    }
  }
};
