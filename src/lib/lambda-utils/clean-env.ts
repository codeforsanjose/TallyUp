import { getEnv } from '../env';
import type { Dependency } from './types';

export const cleanEnv = <T extends readonly string[]>(
  dependencies: Dependency<Record<string, unknown>, T>[],
): {
  [K in T[number]]: string;
} => {
  const env: Record<string, string> = {};
  dependencies.forEach((dep) => {
    dep.requiredEnv.forEach((key) => {
      env[key] = getEnv(key);
    });
  });
  return env as {
    [K in T[number]]: string;
  };
};
