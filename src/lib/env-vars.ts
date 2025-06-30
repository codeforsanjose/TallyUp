import type { DepStrategy } from './build-http-handler';

export type EnvDependency<T extends Record<string, string>> = {
  env: T;
};

export const envDependencyStrategy =
  <T extends Record<string, string>>(
    vars: (keyof T)[],
    env: Record<string, string | undefined>,
  ): DepStrategy<EnvDependency<T>> =>
  async () => {
    const envVars: Partial<T> = {};
    for (const key of vars) {
      if (env[key as string] === undefined) {
        throw new Error(`Environment variable ${String(key)} is not defined`);
      }
      envVars[key] = env[key as string] as T[keyof T];
    }
    return { env: envVars as T };
  };
