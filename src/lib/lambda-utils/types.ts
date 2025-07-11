import { getEnv } from '../env';

export type Dependency<
  T extends Record<string, unknown> = Record<string, unknown>,
  R extends readonly string[] = readonly string[],
> = {
  strategy: (env: Record<string, string | undefined>) => Promise<T>;
  requiredEnv: R;
};

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
