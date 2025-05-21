import type { Result } from '../types';
import type { paths } from './schema';

export const postLogin = async (
  data: NonNullable<paths['/login']['post']['requestBody']>['content']['application/json'],
): Promise<Result<paths['/login']['post']['responses'][200]['content']['application/json']>> => {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const reason = await response.text();
    try {
      const json = JSON.parse(reason);
      return {
        ok: false,
        error: json.message || 'Unknown error',
      };
    } catch (e) {
      return {
        ok: false,
        error: reason || 'Unknown error',
      };
    }
  }

  return {
    ok: true,
    data: await response.json(),
  };
};
