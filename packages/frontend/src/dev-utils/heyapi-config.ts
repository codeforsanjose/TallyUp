import type { CreateClientConfig } from '@hey-api/client-fetch';

export const createClientConfig: CreateClientConfig = (options) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

  return {
    baseUrl,
    fetch: async (request) => {
      if (import.meta.env.DEV)
        return import('../dev-utils').then((module) => module.envDEVFetch(request));

      return fetch(request);
    },
    ...options,
  };
};
