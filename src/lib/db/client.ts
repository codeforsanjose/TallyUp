import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import type { GetSecretValueFn } from '../secrets';
import * as schema from './schema';

export type Db = NeonDatabase<typeof schema> & {
  $client: Pool;
};

type GetDbClientDeps = {
  dbSecretArn: string;
  getSecretValue: GetSecretValueFn;
};

/**
 * GetDbClientFn is a function that returns a database client.
 */
export type GetDbClientFn = (deps: GetDbClientDeps) => Promise<Db>;

export const buildGetClient = () => {
  let db: Db | undefined;
  return async (deps: GetDbClientDeps) => {
    const { dbSecretArn, getSecretValue } = deps;
    if (db) return db;

    const connectionString = await getSecretValue({ secretId: dbSecretArn });
    if (process.env.NODE_ENV === 'development') {
      neonConfig.useSecureWebSocket = false;
      neonConfig.wsProxy = (host) => `${host}:4444/v1`;
    }
    db = drizzle(new Pool({ connectionString }), {
      casing: 'snake_case',
      schema,
    });
    return db;
  };
};

export const getDbClient = buildGetClient();
