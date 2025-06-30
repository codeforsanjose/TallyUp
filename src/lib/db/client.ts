import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { DepStrategy } from '../build-http-handler';
import * as schema from './schema';
import type { EnvDependency } from '../env-vars';

export type DrizzleDep = {
  drizzle: NeonHttpDatabase<typeof schema> & {
    $client: NeonQueryFunction<false, false>;
  };
};

export type DrizzleEnv = {
  SECRET_DB_URL: string;
};

export const withDrizzle =
  (envDependencyStrategy: DepStrategy<EnvDependency<DrizzleEnv>>): DepStrategy<DrizzleDep> =>
  async () => {
    const {
      env: { SECRET_DB_URL: databaseUrl },
    } = await envDependencyStrategy();
    const neonClient = neon(databaseUrl);
    return {
      drizzle: drizzle({
        client: neonClient,
        schema,
        casing: 'snake_case',
      }),
    };
  };
