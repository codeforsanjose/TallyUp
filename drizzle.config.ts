import assert from 'assert';
import { defineConfig } from 'drizzle-kit';

// This is the only file that affects bunx drizzle-kit push.
// So we must pass in params as env vars.
const { DATABASE_URL: dbUrl } = process.env;
assert(dbUrl, 'DATABASE_URL must be defined in process.env');

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  migrations: {
    table: 'migrations',
    schema: 'tally_up',
  },
  casing: 'snake_case',
  dbCredentials: {
    url: dbUrl,
    ssl: {},
  },
});
