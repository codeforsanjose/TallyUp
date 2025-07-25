import type { Signal } from '@builder.io/qwik';
import { postRefreshToken } from './api';
import type { User } from './types';

export const protectedApiCall = <
  T extends (...args: any[]) => Promise<{
    data: unknown;
    status: number;
    headers: Headers;
  }>,
>(
  apiFn: T,
  user: Signal<User>,
): T => {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const { data, headers, status } = await apiFn(args[0], {
      ...args[1],
      headers: {
        ...args[1]?.headers,
        Authorization: `Bearer ${user.value.accessToken}`,
      },
    });
    if (status === 401) {
      // Refresh using refresh token
      const refreshResponse = await postRefreshToken({ refreshToken: user.value.refreshToken });
      if (refreshResponse.status !== 200) {
        console.error('Failed to refresh token:', refreshResponse.data.message);

        user.value = undefined as unknown as User;
        return { data, headers, status } as Awaited<ReturnType<T>>;
      }

      user.value = {
        ...user.value,
        accessToken: refreshResponse.data.accessToken,
        refreshToken: refreshResponse.data.refreshToken,
      };
      // Retry the original API call with the new access token
      return apiFn(args[0], {
        ...args[1],
        headers: {
          ...args[1]?.headers,
          Authorization: `Bearer ${user.value.accessToken}`,
        },
      }) as Awaited<ReturnType<T>>;
    }

    return { data, headers, status } as Awaited<ReturnType<T>>; // Return the original response
  }) as unknown as T;
};
