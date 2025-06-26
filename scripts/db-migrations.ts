import { fromIni } from '@aws-sdk/credential-providers';
import { sql } from 'drizzle-orm';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { entries } from '../drizzle/meta/_journal.json';
import { connect, type Db } from '../src/lib/db';

type DbMigrationsConfig = {
  verbose?: boolean;
};

const processDrizzleMigrations = async (db: Db, config: Required<DbMigrationsConfig>) => {
  // https://github.com/drizzle-team/drizzle-orm/issues/1267#issuecomment-2530875854
  // This is a workaround to ensure that the migrations are processed correctly

  const { verbose } = config;

  assert(entries.length > 0, 'Malformed drizzle migrations. Entries should not be empty.');
  await db.execute(`CREATE TABLE IF NOT EXISTS "tally_up"."migrations" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      idx integer NOT NULL,
      tag text NOT NULL
    );`);

  const maxIdxQuery = await db.execute('SELECT MAX(idx) FROM "tally_up"."migrations";');

  const maxIdx = (maxIdxQuery.rows[0]?.['max'] as number | null) ?? -1;
  if (verbose) console.log(`Maxidx in migrations: ${maxIdx}`);
  const newEntries = entries.filter((entry) => entry.idx > maxIdx);

  if (newEntries.length === 0) {
    if (verbose) console.log('No new migrations to apply.');
    return;
  }

  for (const entry of newEntries) {
    const { tag, idx } = entry;
    // Read {tag}.sql file from ../../drizzle/
    if (verbose) console.log(`Processing migration: ${tag} with idx: ${idx}`);
    const migration = fs.readFileSync(path.resolve(__dirname, `../../drizzle/${tag}.sql`), 'utf-8');
    const statements = migration
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);
    if (verbose) console.log(`Found ${statements.length} statements in migration file: ${tag}.sql`);

    for (const statement of statements) {
      if (verbose) console.log(`Executing statement: ${statement}`);
      await db.execute(sql.raw(statement));
      if (verbose) console.log(`Executed statement: ${statement}`);
    }

    if (verbose) console.log(`Executed migration: ${tag}`);
    await db.execute(sql`INSERT INTO "tally_up"."migrations" (idx, tag) VALUES (${idx}, ${tag});`);
    if (verbose) console.log(`Inserted migration record: idx=${idx}, tag=${tag}`);
  }
};

const dbMigrations = async (config: DbMigrationsConfig) => {
  const defaults: Required<DbMigrationsConfig> = {
    verbose: false,
  };
  const getCredentials = async () =>
    await fromIni({
      profile: 'personal',
    })();

  const finalCfg = { ...defaults, ...config };
  const { verbose } = finalCfg;

  // Run database migrations
  if (verbose) console.log('Running database migrations...');
  const db = await connect({
    clusterEndpoint: 'kqabufsaeiy562yagtucwa6d4a.dsql.us-west-2.on.aws', // TODO: Don't hardcode this
    credentials: getCredentials,
    admin: true, // Use admin credentials for migrations
  });

  if (verbose) console.log('Connected to the database. Starting migrations... Creating role...');
  try {
    await db.execute('CREATE ROLE tally_up_user WITH LOGIN;');
  } catch (error) {
    assert(error instanceof Error, 'Unexpected error type during role creation' + error);

    if ((error.cause as Error).stack?.includes('already exists')) {
      if (verbose) console.log('Role already exists, skipping creation.');
    } else throw new Error(`Failed to create role: ${error.message}`);
  }

  await db.execute('CREATE SCHEMA IF NOT EXISTS tally_up;');

  if (verbose) console.log('Role created successfully. Starting migrations...');
  await processDrizzleMigrations(db, finalCfg);

  if (verbose) console.log('Database migrations completed successfully.');

  await db.$client.end();
};

if (import.meta.main) {
  const argv = yargs(hideBin(process.argv))
    .option('verbose', {
      type: 'boolean',
      description: 'Enable verbose output',
      default: false,
      alias: 'v',
    })
    .parseSync();

  const { verbose } = argv;
  await dbMigrations({ verbose });
}
