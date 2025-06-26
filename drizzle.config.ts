import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  migrations: {
    table: 'migrations',
    schema: 'tally_up',
  },
  schemaFilter: 'tally_up',
});
