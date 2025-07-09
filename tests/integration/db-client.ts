import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../../src/lib/db/schema';

neonConfig.useSecureWebSocket = false;
neonConfig.wsProxy = (host) => `${host}:4444/v1`;

export const client = drizzle(
  new Pool({
    connectionString: 'postgres://postgres:postgres@db.localtest.me:5432',
  }),
  { casing: 'snake_case', schema },
);
