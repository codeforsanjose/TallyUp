import type { paths } from './schema';
import type { Result } from '../types';
import { assert } from '../assert';

export const postRegister = async (
  data: NonNullable<paths['/register']['post']['requestBody']>['content']['application/json'],
): Promise<Result<paths['/register']['post']['responses'][200]['content']['application/json']>> => {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const reason = await response.text();
    try {
      const json = JSON.parse(reason) as unknown;
      assert(
        typeof json === 'object' && !!json && 'message' in json && typeof json.message === 'string',
      );
      return { success: false, error: new Error(json.message) };
    } catch (e) {
      return { success: false, error: new Error(reason) };
    }
  }
  return { success: true, data: await response.json() };
};
