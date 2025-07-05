import assert from 'assert';
import { defineConfig } from 'drizzle-kit';

const { DATABASE_URL: dbUrl } = process.env;
assert(dbUrl, 'DATABASE_URL must be defined in .env file');

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
  },
});
