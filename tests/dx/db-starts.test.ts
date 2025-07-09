import { neonConfig, Pool } from '@neondatabase/serverless';
import { beforeAll, test, expect, afterAll } from 'bun:test';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import path from 'path';
import { downMany, upMany } from 'docker-compose';
beforeAll(async () => {
  await upMany(['db', 'neonDbProxy'], {
    cwd: path.resolve(__dirname, '../../'),
    env: {
      ...process.env,
      COMPOSE_PROJECT_NAME: 'dx-test',
    } as unknown as NodeJS.ProcessEnv,
  });
});

afterAll(async () => {
  await downMany(['db', 'neonDbProxy'], {
    cwd: path.resolve(__dirname, '../../'),
    env: {
      ...process.env,
      COMPOSE_PROJECT_NAME: 'dx-test',
    } as unknown as NodeJS.ProcessEnv,
  });
});

test('Drizzle can connect to the database and run a query', async () => {
  // Check if the db is running by connecting to it
  neonConfig.useSecureWebSocket = false;
  neonConfig.wsProxy = (host) => `${host}:4444/v1`;
  const neonClient = new Pool({
    connectionString: 'postgres://postgres:postgres@db.localtest.me:5432',
  });
  const drizzleClient = drizzle(neonClient);
  const result = await drizzleClient.execute(sql`SELECT 1+1 AS result`);
  expect(result.rows[0]?.['result']).toBe(2);
  await drizzleClient.$client.end();
});
