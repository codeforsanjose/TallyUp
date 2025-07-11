import type { Dependency } from './cleanEnv';

/** Type cast fucntion */
export const createDependency = <T extends Record<string, unknown>, R extends readonly string[]>(
  strategy: (env: Record<string, string | undefined>) => Promise<T>,
  requiredEnv: R,
): Dependency<T, R> => {
  return {
    strategy,
    requiredEnv,
  };
};
